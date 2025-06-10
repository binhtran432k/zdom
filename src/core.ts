import {
	type ConnectableDom,
	type HintedString,
	type ZDomBinding,
	type ZDomDeps,
	type ZDomElement,
	type ZDomElementAttributes,
	type ZDomIntrinsicElements,
	type ZDomState,
	type ZDomXmlNS,
	_undefined,
	addAndScheduleOnFirst,
	createWithProto,
	isFunction,
	isNode,
	isZDomState,
	keepConnected,
	newDeps,
} from "./utils";

let curDeps: ZDomDeps | undefined;
let statesToGc: Set<ZDomState> | undefined;
let curNewDerives: ZDomBinding[] | undefined;

const alwaysConnectedDom: Readonly<ConnectableDom> = { isConnected: 1 };

let derivedStates: Set<ZDomState> | undefined;
let changedStates: Set<ZDomState> | undefined;

let curNS: ZDomXmlNS | undefined;

const GC_CYCLE_IN_MS = 1000;

export const zdomStateProto: ThisType<ZDomState> = {
	get val() {
		curDeps?.gs?.add(this);
		return this.rawVal;
	},
	get oldVal() {
		curDeps?.gs?.add(this);
		return this.ov;
	},
	set val(v) {
		curDeps?.ss?.add(this);
		v !== this.rawVal &&
			((this.rawVal = v),
			this.bs.length + this.ls.length
				? (derivedStates?.add(this),
					(changedStates = addAndScheduleOnFirst(
						changedStates,
						this,
						updateDoms,
					)))
				: (this.ov = v));
	},
};

export const state = <T>(x: T): ZDomState<T> =>
	createWithProto(
		{
			rawVal: x,
			ov: x,
			bs: [],
			ls: [],
		},
		zdomStateProto as ZDomState<T>,
	);

export const withNS = <T>(ns: ZDomXmlNS, f: (ns: ZDomXmlNS) => T): T => {
	const preNS = curNS;
	try {
		curNS = ns;
		return f(ns);
	} finally {
		curNS = preNS;
	}
};

export const tag = (
	tagName: HintedString<keyof ZDomIntrinsicElements>,
	{ is, innerHTML, outerHTML, ...props }: ZDomElementAttributes,
	...children: ZDomElement[]
): Element => {
	const dom = curNS
		? document.createElementNS(curNS, tagName, { is })
		: document.createElement(tagName, { is });

	Object.entries(props)
		.filter(([, v]) => v != _undefined)
		.map<[(x: unknown, ox?: unknown) => unknown, unknown]>(([k, v]) =>
			k.startsWith("on")
				? [getEventSetter(dom, k.slice(2)), v]
				: [
						getAttrSetter(dom, k),
						isFunction(v) ? derive(v as (x: unknown) => unknown) : v,
					],
		)
		.forEach(([setter, v]) =>
			isZDomState(v) ? bind(() => (setter(v.val, v.ov), dom)) : setter(v),
		);

	outerHTML
		? (dom.outerHTML = outerHTML)
		: innerHTML
			? (dom.innerHTML = innerHTML)
			: dom.append(...toDoms(children));

	return dom;
};

export const toDoms = (...children: ZDomElement[]): (Node | string)[] =>
	children
		.flat(Infinity)
		.map((child) =>
			isZDomState(child)
				? bind(() => child.val)
				: isFunction(child)
					? bind(child as (x?: unknown) => unknown)
					: child,
		)
		.filter((x) => x)
		.map((child) => (isNode(child) ? child : String(child)));

const getAttrSetter =
	(elem: Element, attrName: string): ((v: unknown) => unknown) =>
	(v) =>
		(v || v === 0) &&
		elem.setAttribute(attrName, v === true ? attrName : String(v));

const getEventSetter =
	(
		elem: Element,
		event: string,
	): ((value: unknown, oldValue?: unknown) => unknown) =>
	(value, oldValue) => (
		isFunction(oldValue) &&
			elem.removeEventListener(event, oldValue as () => unknown),
		isFunction(value) && elem.addEventListener(event, value as () => unknown)
	);

export const derive = <T>(
	f: (x: T) => T,
	s: ZDomState<T> = state<T>(_undefined as T),
	dom?: ConnectableDom,
): ZDomState<T> => {
	const deps = newDeps();
	const listener: ZDomBinding<T> = { f, s };

	type AlwaysDisconnectedDom = ConnectableDom | undefined;
	listener.d =
		dom ??
		(curNewDerives?.push(listener) as AlwaysDisconnectedDom) ??
		alwaysConnectedDom;

	s.val = runAndCaptureDeps(f, deps, s.rawVal);

	for (const d of deps.gs)
		deps.ss.has(d) || (addStatesToGc(d), d.ls.push(listener));

	return s;
};

export const runAndCaptureDerives = <T>(
	f: (derives: ZDomBinding[]) => T,
): T => {
	const prevNewDerives = curNewDerives;

	curNewDerives = [];
	const res = f(curNewDerives);

	curNewDerives = prevNewDerives;

	return res;
};

export const runAndCaptureDeps = <U, V>(
	f: (x: U) => V,
	deps: ZDomDeps,
	arg: U,
): U | V => {
	const prevDeps = curDeps;
	curDeps = deps;
	try {
		return f(arg);
	} catch (e) {
		console.error(e);
		return arg;
	} finally {
		curDeps = prevDeps;
	}
};

export const addStatesToGc = (d: ZDomState): Set<ZDomState> =>
	(statesToGc = addAndScheduleOnFirst(
		statesToGc,
		d,
		() => {
			for (const s of statesToGc!)
				(s.bs = keepConnected(s.bs)), (s.ls = keepConnected(s.ls));
			statesToGc = _undefined;
		},
		GC_CYCLE_IN_MS,
	));

const updateDoms = () => {
	let iter = 0;
	let derivedStatesArray = [...changedStates!].filter((s) => s.rawVal !== s.ov);

	do {
		derivedStates = new Set();

		for (const l of new Set(
			derivedStatesArray.flatMap((s) => (s.ls = keepConnected(s.ls))),
		))
			derive(l.f, l.s, l.d), (l.d = _undefined);
	} while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length);

	const changedStatesArray = [...changedStates!].filter(
		(s) => s.rawVal !== s.ov,
	);
	changedStates = _undefined;

	for (const b of new Set(
		changedStatesArray.flatMap((s) => (s.bs = keepConnected(s.bs))),
	))
		updateRawDom(b.d as ChildNode, bind(b.f, b.d)), (b.d = _undefined);

	for (const s of changedStatesArray) s.ov = s.rawVal;
};

const updateRawDom = (dom: ChildNode, newDom?: Node | string): false | void =>
	newDom ? newDom !== dom && dom.replaceWith(newDom) : dom.remove();

const bind = <U>(f: (x?: U) => unknown, dom?: U): ChildNode | undefined => {
	const deps = newDeps();
	const binding: ZDomBinding = { f };
	return (binding.d = runAndCaptureDerives((derives) => {
		const maybeDom = runAndCaptureDeps(f, deps, dom);
		const newDom = isNode(maybeDom ?? document)
			? (maybeDom as ChildNode | undefined)
			: new Text(String(maybeDom));

		for (const d of deps.gs)
			deps.ss.has(d) || (addStatesToGc(d), d.bs.push(binding));

		for (const l of derives) l.d = newDom;

		return newDom;
	}));
};
