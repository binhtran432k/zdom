import {
  addStatesToGc,
  derive,
  runAndCaptureDeps,
  runAndCaptureDerives,
  setOnSetState,
} from "./core";
import type { JSX } from "./jsx";
import {
  _document,
  _Object,
  _String,
  _undefined,
  addAndScheduleOnFirst,
  getPropDescriptior,
  isFunction,
  isNode,
  isString,
  isZDomElement,
  isZDomState,
  keepConnected,
  newDeps,
  type ZDomBinding,
  type ZDomElement,
  type ZDomState,
} from "./utils";

let derivedStates: Set<ZDomState> | undefined;
let changedStates: Set<ZDomState> | undefined;

let curCreateElement: (
  tagName: string,
  options: ElementCreationOptions,
) => Element = _document.createElement.bind(_document);

export const toDoms = (...children: JSX.Element[]): (Node | string)[] =>
  children.flat(Infinity)
    .map(child => isZDomState(child)
      ? bind(() => child.val)
      : isFunction(child)
        ? bind(child as (x?: unknown) => unknown)
        : child)
    .filter(child => child != _undefined)
    .map(child => isZDomElement(child)
      ? toDom(child)
      : isNode(child)
        ? child
        : _String(child));

const toDom = ({ v: [tagName, { is, ...props }, children] }: ZDomElement): Element => {
  const preCreateElement = curCreateElement;

  const maybeNS = props["xmlns"];
  isString(maybeNS)
    && (curCreateElement = _document.createElementNS.bind(_document, maybeNS));

  const dom = curCreateElement(tagName, { is });

  _Object.entries(props)
    .filter(([, v]) => v != _undefined)
    .map<[(x: unknown, ox?: unknown) => unknown, unknown]>(([k, v]) =>
      k.startsWith("on")
        ? [getEventSetter(dom, k.slice(2)), v]
        : [
          getAttrSetter(dom, tagName, k),
          isFunction(v)
            ? derive(v as (x: unknown) => unknown)
            : v,
        ])
    .forEach(([setter, v]) => isZDomState(v)
      ? bind(() => (setter(v.val, v.ov), dom))
      : setter(v));

  dom.append(...toDoms(children));

  curCreateElement = preCreateElement;

  return dom;
}

const propSetterCache: Record<string, PropertyDescriptor["set"] | 0> = {};
const getAttrSetter = (
  elem: Element,
  tagName: string,
  attrName: string,
): (v: unknown) => unknown => {
  const setter =
    propSetterCache[tagName + "," + attrName]
    ??= getPropDescriptior(elem, attrName)?.set ?? 0;
  return setter
    ? setter.bind(elem)
    : (v) =>
      v != _undefined
      && v !== false
      && elem.setAttribute(attrName, v === true ? attrName : _String(v));
}

const getEventSetter = (
  elem: Element,
  event: string,
): (value: unknown, oldValue?: unknown) => unknown =>
  (value, oldValue) => (
    isFunction(oldValue) && elem.removeEventListener(event, oldValue as () => unknown),
    isFunction(value) && elem.addEventListener(event, value as () => unknown)
  );

export const setupClient = (): unknown =>
  setOnSetState(<T>(state: ZDomState<T>, v: T): unknown => (
    state.rawVal = v,
    state.bs.length + state.ls.length
      ? (derivedStates?.add(state),
        changedStates = addAndScheduleOnFirst(changedStates, state, updateDoms))
      : state.ov = v)
  )

const updateDoms = () => {
  let iter = 0;
  let derivedStatesArray = [...changedStates!].filter(s => s.rawVal !== s.ov);

  do {
    derivedStates = new Set;

    for (const l of
      new Set(derivedStatesArray
        .flatMap(s => s.ls = keepConnected(s.ls))))
      (derive(l.f, l.s, l.d), l.d = _undefined)

  } while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length);

  const changedStatesArray = [...changedStates!].filter(s => s.rawVal !== s.ov);
  changedStates = _undefined;

  for (const b of
    new Set(changedStatesArray
      .flatMap(s => s.bs = keepConnected(s.bs))))
    (updateRawDom(b.d as ChildNode, bind(b.f, b.d)), b.d = _undefined)

  for (const s of changedStatesArray)
    s.ov = s.rawVal;
}

const updateRawDom = (
  dom: ChildNode,
  newDom?: Node | string,
): false | void =>
  newDom
    ? newDom !== dom && dom.replaceWith(newDom)
    : dom.remove();

const bind = <U>(f: (x?: U) => unknown, dom?: U): ChildNode | undefined => {
  const deps = newDeps();
  const binding: ZDomBinding = { f };
  return binding.d = runAndCaptureDerives((derives) => {
    const maybeDom = runAndCaptureDeps(f, deps, dom);
    const newDom = isNode(maybeDom ?? _document)
      ? maybeDom as ChildNode | undefined
      : isZDomElement(maybeDom)
        ? toDom(maybeDom)
        : new Text(_String(maybeDom));

    for (const d of deps.gs)
      deps.ss.has(d)
        || (addStatesToGc(d), d.bs.push(binding));

    for (const l of derives)
      l.d = newDom;

    return newDom;
  });
}
