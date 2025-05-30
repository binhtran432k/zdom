import { zdomStateProto, zdomElemProto } from "./core.js";
import type { JSX } from "./jsx";

export let _undefined: undefined;
export const _Object: typeof Object = Object;
export const _String: typeof String = String;
export const _document: typeof document = document;

export const protoOf = (x: unknown): any => x ? _Object.getPrototypeOf(x): x;

export const createWithProto = <U, V extends Object>(
  obj: U,
  proto: V,
): U & V => (_Object.setPrototypeOf(obj, proto), obj as U & V);

export interface ZDomDeps {
  /** Getters */
  gs: Set<ZDomState>;
  /** Setters */
  ss: Set<ZDomState>;
}

export interface ZDomBinding<
  U = unknown,
  V extends ConnectableDom = ConnectableDom
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

export interface ZDomElement {
  v: [
    tagName: string,
    props: Record<string, unknown> & { is?: string },
    children?: JSX.Element,
  ];
}

export const newDeps = (): ZDomDeps => ({
  gs: new Set,
  ss: new Set,
});

export const addAndScheduleOnFirst = <T>(
  set: Set<T> | undefined,
  s: T,
  f: () => void,
  waitMs?: number,
): Set<T> =>
  (set
    ?? (setTimeout(f, waitMs),
      new Set)
  ).add(s);

export const getPropDescriptior = (
  obj: unknown,
  k: string,
): PropertyDescriptor | undefined =>
  obj
    ? (_Object.getOwnPropertyDescriptor(obj, k)
      ?? getPropDescriptior(protoOf(obj), k))
    : _undefined;

export const keepConnected = <U>(l: ZDomBinding<U>[]): ZDomBinding<U>[] =>
  l.filter(b => b.d?.isConnected);

export const isNode = (x: unknown): x is Node =>
  (x as Node).nodeType as unknown as boolean;

export const isZDomElement = (x: unknown): x is ZDomElement =>
  protoOf(x) == zdomElemProto;

export const isZDomState = (x: unknown): x is ZDomState =>
  protoOf(x) == zdomStateProto;

const funcProto = protoOf(protoOf);
export const isFunction = <T>(
  x: T | Function,
): x is Function | Extract<T, Function> =>
  protoOf(x) == funcProto;

const stringProto = protoOf("");
export const isString = (
  x: unknown,
): x is string =>
  protoOf(x) == stringProto;

const objProto = protoOf({});
export const isObject = (
  x: unknown,
): boolean =>
  protoOf(x) == objProto;
