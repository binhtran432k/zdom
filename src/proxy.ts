import { setupClient, toDoms } from "./client";
import { derive, newZDomElement, state } from "./core";
import type { JSX } from "./jsx";
import { _undefined, isObject } from "./utils";

export interface TagFunc {
  (name: string,
    props: Record<string, unknown>,
    ...args: JSX.Element[]
  ): JSX.Element;
  (name: string, ...args: JSX.Element[]): JSX.Element;
}

export interface OmitNameTagFunc {
  (props: Record<string, unknown>,
    ...args: JSX.Element[]
  ): JSX.Element;
  (...args: JSX.Element[]): JSX.Element;
}

export type ZDomTags =
  Record<string, OmitNameTagFunc> & TagFunc;

export interface ZDom {
  derive: typeof derive;
  state: typeof state;
  toDoms: typeof toDoms;
  tags: ZDomTags;
}

const tag: TagFunc = (name, ...args): JSX.Element => {
  const [props, ...children] = isObject(args[0] ?? 0) ? args : [{}, args];
  return newZDomElement([name, props as Record<string, unknown>, children])
}

const tags =
  new Proxy(tag, { get: (x, name) => x.bind(_undefined, name as string) }) as ZDomTags;

setupClient();
const zdom: ZDom = {
  derive,
  state,
  toDoms,
  tags,
}

export default zdom;
