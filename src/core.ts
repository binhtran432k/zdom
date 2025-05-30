import {
  _undefined,
  addAndScheduleOnFirst,
  createWithProto,
  keepConnected,
  newDeps,
  type ConnectableDom,
  type ZDomBinding,
  type ZDomDeps,
  type ZDomElement,
  type ZDomState,
} from "./utils";

let curDeps: ZDomDeps | undefined;
let statesToGc: Set<ZDomState> | undefined;
let curNewDerives: ZDomBinding[] | undefined;
let curOnSetState: (<T>(s: ZDomState<T>, v: T) => void) | undefined;

const alwaysConnectedDom: Readonly<ConnectableDom> = { isConnected: 1 };

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
    v !== this.rawVal
      && curOnSetState?.(this, v);
  },
};

export const state = <T>(x: T): ZDomState<T> => createWithProto({
  rawVal: x,
  ov: x,
  bs: [],
  ls: [],
}, zdomStateProto as ZDomState<T>);

export const setOnSetState = (onSetState: typeof curOnSetState): unknown =>
  curOnSetState = onSetState;

export const zdomElemProto = {};
export const newZDomElement = (v: ZDomElement["v"]): ZDomElement =>
  createWithProto({ v }, zdomElemProto);

export const derive = <T>(
  f: (x: T) => T,
  s: ZDomState<T> = state<T>(_undefined as T),
  dom?: ConnectableDom,
): ZDomState<T> => {
  const deps = newDeps();
  const listener: ZDomBinding<T> = { f, s };

  type AlwaysDisconnectedDom = ConnectableDom | undefined;
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

export const runAndCaptureDerives = <T>(f: (derives: ZDomBinding[]) => T): T => {
  const prevNewDerives = curNewDerives;

  curNewDerives = [];
  const res = f(curNewDerives);

  curNewDerives = prevNewDerives;

  return res;
}

export const runAndCaptureDeps = <U, V>(f: (x: U) => V, deps: ZDomDeps, arg: U): U | V => {
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

export const addStatesToGc = (d: ZDomState): Set<ZDomState> =>
  statesToGc = addAndScheduleOnFirst(statesToGc, d, () => {
    for (const s of statesToGc!)
      (s.bs = keepConnected(s.bs),
        s.ls = keepConnected(s.ls))
    statesToGc = _undefined;
  }, GC_CYCLE_IN_MS);
