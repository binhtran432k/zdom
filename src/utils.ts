import { zdomStateProto } from "./core";

export let _undefined: undefined;

export const protoOf = (x: unknown): unknown =>
	x ? Object.getPrototypeOf(x) : x;

export const createWithProto = <U, V extends Object>(
	obj: U,
	proto: V,
): U & V => (Object.setPrototypeOf(obj, proto), obj as U & V);

export interface ZDomDeps {
	/** Getters */
	gs: Set<ZDomState>;
	/** Setters */
	ss: Set<ZDomState>;
}

export interface ZDomBinding<
	U = unknown,
	V extends ConnectableDom = ConnectableDom,
> {
	/** Binding Function */
	f: (x: any) => any;
	/** State */
	s?: ZDomState<U>;
	/** Dom */
	d?: V;
}

export interface ConnectableDom {
	isConnected: unknown;
}

export interface ZDomState<T = unknown> {
	rawVal: T;
	/** @internal Old Value */
	ov: T;
	/** @internal Bindings */
	bs: ZDomBinding[];
	/** @internal Listeners */
	ls: ZDomBinding[];
	get val(): T;
	get oldVal(): T;
	set val(v: T);
}

export type PropsWithChildren<T = {}> = T & {
	children?: ZDomElement;
};

export type ZDomElement = ZDomJSXElementSingle | ZDomJSXElementSingle[];

type ZDomJSXElementSingle =
	| ZDomState
	| string
	| number
	| bigint
	| boolean
	| undefined
	| null
	| Node
	| Object;

export type ZDomIntrinsicElements = {
	[TagName in
		| keyof HTMLElementTagNameMap
		| keyof SVGElementTagNameMap
		| keyof MathMLElementTagNameMap]: PropsWithChildren<ZDomElementAttributes>;
};

export type ZDomElementAttributes = {
	[k in keyof CommonAttributes]?: AttributeType<CommonAttributes[k]>;
} & {
	[k in keyof StrictCommonAttributes]?: StrictCommonAttributes[k];
} & {
	[Attribute in DashPrefixAttributeName<
		keyof ARIAMixin,
		"aria"
	>]?: AttributeType<string>;
} & EventAttributes &
	Record<string, unknown>;

interface CommonAttributes {
	autocomplete: AutoFill;
	dir: "ltr" | "rtl" | "auto";
	draggable: "true" | "false";
	popover: "auto" | "hint" | "manual";

	action: string;
	alt: string;
	as: string;
	class: string;
	content: string;
	for: string;
	href: string;
	id: string;
	name: string;
	rel: string;
	src: string;
	style: string;
	role: string;
	target: string;
	title: string;
	type: string;

	cols: number;
	colspan: number;
	height: number;
	length: number;
	max: number;
	maxlength: number;
	min: number;
	minlength: number;
	rows: number;
	rowspan: number;
	tabindex: number;
	width: number;

	async: boolean;
	autoplay: boolean;
	checked: boolean;
	disabled: boolean;
	required: boolean;
}

interface StrictCommonAttributes {
	is: string;
	xmlns: ZDomXmlNS;
}

export type ZDomXmlNS = HintedString<
	| "http://www.w3.org/1999/xhtml"
	| "http://www.w3.org/2000/svg"
	| "http://www.w3.org/1998/Math/MathML"
> | null;

type DashPrefixAttributeName<
	S extends string,
	Prefix extends string,
> = S extends `${Prefix}${infer T}`
	? `${Prefix}${T extends Capitalize<T> ? "-" : ""}${Lowercase<T>}`
	: Lowercase<S>;

type AttributeType<T> =
	| (T extends string ? HintedString<T> : T | string)
	| ZDomState<T>
	| ((...x: any) => T);

type EventAttributes<
	E extends keyof DocumentEventMap = keyof DocumentEventMap,
> = {
	[k in `on${E}`]?: EventAttributeType<(ev: DocumentEventMap[E]) => unknown>;
};

type EventAttributeType<T> = T | ZDomState<T>;

export type HintedString<T extends string> = T | (string & {});

export const newDeps = (): ZDomDeps => ({
	gs: new Set(),
	ss: new Set(),
});

export const addAndScheduleOnFirst = <T>(
	set: Set<T> | undefined,
	s: T,
	f: () => void,
	waitMs?: number,
): Set<T> => (set ?? (setTimeout(f, waitMs), new Set())).add(s);

export const keepConnected = <U>(l: ZDomBinding<U>[]): ZDomBinding<U>[] =>
	l.filter((b) => b.d?.isConnected);

export const isNode = (x: unknown): x is Node =>
	(x as Node).nodeType as unknown as boolean;

export const isZDomState = (x: unknown): x is ZDomState =>
	protoOf(x) == zdomStateProto;

const funcProto = protoOf(protoOf);
export const isFunction = <T>(
	x: T | Function,
): x is Function | Extract<T, Function> => protoOf(x) == funcProto;

const objProto = protoOf({});
export const isObject = (x: unknown): boolean => protoOf(x) == objProto;
