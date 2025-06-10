import { toDoms } from "./core";
import type { ZDomElement } from "./utils";

const DEFAULT_OPTS: PrerenderOpts = {
	html: 0,
	disableSetTimeout: 1,
};

export interface PrerenderOpts {
	/** @default {0} */
	html?: 1 | 0;
	/** @default {1} */
	disableSetTimeout?: 1 | 0;
}

export const prerender = (
	f: () => ZDomElement,
	opts: PrerenderOpts = {},
): string => {
	opts = { ...DEFAULT_OPTS, ...opts };

	const originDocument = globalThis.document;
	const originText = globalThis.Text;
	const originSetTimeout = globalThis.setTimeout;

	globalThis.document = prerenderDocument;
	globalThis.Text = String as unknown as typeof Text;
	opts.disableSetTimeout &&
		(globalThis.setTimeout = (() => 0) as unknown as typeof setTimeout);

	try {
		return (
			(opts.html ? "<!DOCTYPE html>" : "") +
			toDoms(f())
				.map((x) => x.toString())
				.join("")
		);
	} finally {
		globalThis.document = originDocument;
		globalThis.Text = originText;
		globalThis.setTimeout = originSetTimeout;
	}
};

const VOID_TAGS =
	/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
const NO_ESCAPE_TAGS = /^(?:script|style)$/;

const ESCAPE_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
} as const;

class PrerenderElement {
	nodeType = 1;

	private attributes: Record<string, string> = {};
	private children: (PrerenderElement | string)[] = [];
	private isRemoved?: 1;
	private overrideOuterHTML?: string;

	constructor(
		public namespaceURI: string | null,
		public tagName: string,
	) {}

	get innerHTML(): string {
		if (this.isRemoved) return "";

		const grpChildren: (PrerenderElement | string)[] = [];

		for (const child of this.children) {
			if (
				!grpChildren.length ||
				child instanceof PrerenderElement ||
				grpChildren[grpChildren.length - 1] instanceof PrerenderElement
			) {
				grpChildren.push(child);
			} else {
				grpChildren[grpChildren.length - 1] += child;
			}
		}

		return grpChildren
			.map(
				!this.namespaceURI && NO_ESCAPE_TAGS.test(this.tagName)
					? (x) => x.toString()
					: (x) =>
							x instanceof PrerenderElement ? x.toString() : toEscapeString(x),
			)
			.join("");
	}

	set innerHTML(v: string) {
		this.children = [v];
	}

	get outerHTML(): string {
		return this.isRemoved
			? ""
			: (this.overrideOuterHTML ??
					`<${[
						this.tagName,
						...Object.entries(this.attributes).map(([k, v]) =>
							!this.namespaceURI && k == v
								? k
								: `${k}=${JSON.stringify(v.replace(/"/g, "&quot;"))}`,
						),
					].join(" ")}${
						!this.namespaceURI && VOID_TAGS.test(this.tagName)
							? ""
							: this.namespaceURI && !this.innerHTML
								? "/"
								: `>${this.innerHTML}</${this.tagName}`
					}>`);
	}

	set outerHTML(v: string) {
		this.overrideOuterHTML = v;
	}

	setAttribute(name: string, value: string): void {
		this.attributes[name] = value;
	}

	addEventListener(): void {}

	removeEventListener(): void {}

	append(...items: (PrerenderElement | string)[]): void {
		this.children.push(...items);
	}

	replaceWith(item: PrerenderElement | string): void {
		if (item instanceof PrerenderElement) {
			if (item.isRemoved) return this.remove();
			this.tagName = item.tagName;
			this.namespaceURI = item.namespaceURI;
			this.nodeType = item.nodeType;
			this.attributes = item.attributes;
			this.children = item.children;
			this.overrideOuterHTML = item.overrideOuterHTML;
		} else {
			this.overrideOuterHTML = String(item);
		}
	}

	remove(): void {
		this.isRemoved = 1;
	}

	toString(): string {
		return this.outerHTML;
	}
}

const prerenderDocument = {
	nodeType: 1,
	createElement: (tagName: string) => new PrerenderElement(null, tagName),
	createElementNS: (ns: string | null, tagName: string) =>
		new PrerenderElement(ns, tagName),
} as unknown as Document;

const toEscapeString = (x: string): string =>
	x
		.replace(
			/[&<>]/g,
			(tag) => ESCAPE_MAP[tag as keyof typeof ESCAPE_MAP] || tag,
		)
		.replace(/\s\s+/g, " ");
