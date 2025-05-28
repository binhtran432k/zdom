import { ZDomElement, ZDomState } from "./core";

export let _undefined: undefined;

export interface ZDomDeps {
  /** Getters */
  gs: Set<ZDomState>;
  /** Setters */
  ss: Set<ZDomState>;
}

export interface ZDomBinding<T = unknown> {
  /** Binding Function */
  f: (x: any) => any;
  /** State */
  s?: ZDomState<T>;
  /** Dom */
  d?: ChildNode;
}

export const newDeps = (): ZDomDeps => ({
  gs: new Set,
  ss: new Set,
});

export const setAttr = (
  elem: Element,
  name: string,
  value: unknown,
): void | boolean =>
  value != _undefined
  && value !== false
  && elem.setAttribute(name, value === true
    ? name
    : String(value));

export const setEvent = (
  elem: Element,
  event: string,
  value: unknown,
  oldValue?: unknown,
): void | boolean => (
  isFunction(oldValue) && elem.removeEventListener(event, oldValue),
  isFunction(value) && elem.addEventListener(event, value)
);

export const updateRawDom = (
  dom: ChildNode,
  newDom?: Node | string,
): false | void =>
  newDom
    ? newDom !== dom && dom.replaceWith(newDom)
    : dom.remove();

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

export const keepConnected = <T>(l: ZDomBinding<T>[]): ZDomBinding<T>[] =>
  l.filter(b => b.d?.isConnected);

export const isZDomElement = (x: unknown): x is ZDomElement => x instanceof ZDomElement;

export const isZDomState = (x: unknown): x is ZDomState => x instanceof ZDomState;

export const isNode = (x: unknown): x is Node => x instanceof Node;

export const isFunction = (x: unknown): x is () => any => typeof x == "function";
