import {
  _undefined,
  addAndScheduleOnFirst,
  isFunction,
  isNode,
  isZDomElement,
  isZDomState,
  keepConnected,
  newDeps,
  setAttr,
  setEvent,
  updateRawDom,
  type ZDomBinding,
  type ZDomDeps,
} from "./utils";

let derivedStates: Set<ZDomState> | undefined;
let changedStates: Set<ZDomState> | undefined;
let curDeps: ZDomDeps | undefined;
let statesToGc: Set<ZDomState> | undefined;
let curNewDerives: ZDomBinding[] | undefined;
let curNS: string | undefined;

const alwaysConnectedDom = { isConnected: 1 } as unknown as ChildNode;

const GC_CYCLE_IN_MS = 1000;

export class ZDomState<T = unknown> {
  /** Raw Old Value */
  ov: T;
  /** Internal Bindings */
  bs: ZDomBinding[] = [];
  /** Internal Listeners */
  ls: ZDomBinding[] = [];

  constructor(public rawVal: T) {
    this.ov = rawVal;
  }

  get val(): T {
    curDeps?.gs?.add(this);
    return this.rawVal;
  }

  get oldVal(): T {
    curDeps?.gs?.add(this);
    return this.ov;
  }

  set val(v) {
    curDeps?.ss?.add(this);
    v !== this.rawVal
      && (
        this.rawVal = v,
        this.bs.length + this.ls.length
          ? (derivedStates?.add(this),
            changedStates = addAndScheduleOnFirst(changedStates, this, updateDoms))
          : this.ov = v
      )
  }
}

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
    (updateRawDom(b.d!, bind(b.f, b.d)), b.d = _undefined)

  for (const s of changedStatesArray)
    s.ov = s.rawVal;
}

export const state = <T>(x: T): ZDomState<T> => new ZDomState(x);

export class ZDomElement {
  v: [
    tagName: string,
    attributes: Record<string, unknown>,
    events: Record<string, unknown>,
    children: unknown,
    is?: string,
  ];

  constructor(
    tagName: string,
    attributes: Record<string, unknown>,
    events: Record<string, unknown>,
    children: unknown,
    is?: unknown,
  ) {
    this.v = [
      tagName,
      attributes,
      events,
      children,
      is ? String(is) : _undefined,
    ];
  }
}

export const toDoms = (...children: unknown[]): (Node | string)[] =>
  children.flat(Infinity)
    .map(rawChild => isZDomState(rawChild)
      ? bind(() => rawChild.val)
      : isFunction(rawChild)
        ? bind(rawChild)
        : rawChild)
    .filter(child => child != _undefined)
    .map(child => isZDomElement(child)
      ? toDom(child)
      : isNode(child)
        ? child
        : String(child));

const toDom = ({ v: [tagName, attributes, events, children, is] }: ZDomElement): Element => {
  const preNS = curNS;

  const maybeNS = attributes["xmlns"];
  typeof maybeNS == "string" && (curNS = maybeNS);

  const dom = curNS
    ? document.createElementNS(curNS, tagName, { is })
    : document.createElement(tagName, { is });

  for (const [k, v] of Object.entries(attributes))
    isZDomState(v)
      ? bind(() => (setAttr(dom, k, v.val), dom))
      : setAttr(dom, k, v)

  for (const [k, v] of Object.entries(events))
    isZDomState(v)
      ? bind(() => (setEvent(dom, k, v.val, v.ov), dom))
      : setEvent(dom, k, v)

  dom.append(...toDoms(children));

  curNS = preNS;

  return dom;
}

export const derive = <T>(
  f: (x: T) => T,
  s: ZDomState<T> = state<T>(_undefined as T),
  dom?: ChildNode,
): ZDomState<T> => {
  const deps = newDeps();
  const listener: ZDomBinding<T> = { f, s };

  type AlwaysDisconnectedDom = ChildNode | undefined;

  listener.d = dom
    ?? curNewDerives?.push(listener) as AlwaysDisconnectedDom
    ?? alwaysConnectedDom;

  s.val = runAndCaptureDeps(f, deps, s.rawVal);

  for (const d of deps.gs)
    deps.ss.has(d)
      || (addStatesToGc(d),
        d.ls.push(listener))

  return s;
}

const bind = <U>(f: (x?: U) => unknown, dom?: U): ChildNode | undefined => {
  const deps = newDeps();
  const binding: ZDomBinding = { f };
  const prevNewDerives = curNewDerives;

  curNewDerives = [];

  const maybeDom: unknown = runAndCaptureDeps(f, deps, dom);
  const newDom = isNode(maybeDom ?? document)
    ? maybeDom as ChildNode | undefined
    : isZDomElement(maybeDom)
      ? toDom(maybeDom)
      : new Text(String(maybeDom));

  for (const d of deps.gs)
    deps.ss.has(d)
      || (addStatesToGc(d), d.bs.push(binding));

  for (const l of curNewDerives)
    l.d = newDom;

  curNewDerives = prevNewDerives;

  return binding.d = newDom;
}

const runAndCaptureDeps = <U, V>(f: (x: U) => V, deps: ZDomDeps, arg: U): U | V => {
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
}

const addStatesToGc = (d: ZDomState) =>
  statesToGc = addAndScheduleOnFirst(statesToGc, d, () => {
    for (const s of statesToGc!)
      (s.bs = keepConnected(s.bs),
        s.ls = keepConnected(s.ls))
    statesToGc = _undefined;
  }, GC_CYCLE_IN_MS);
