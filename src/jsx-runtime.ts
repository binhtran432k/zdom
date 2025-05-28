import { derive, ZDomElement } from "./core";
import type { JSX, PropsWithChildren, ZDomJSXDecl } from "./jsx";
import { _undefined, isFunction } from "./utils";

export type { JSX, PropsWithChildren } from "./jsx";

export const Fragment = (props: PropsWithChildren): JSX.Element =>
  props.children;

const createElement = (
  decl: ZDomJSXDecl,
  propsWithChildren: Record<string, unknown>,
): JSX.Element => {
  if (typeof decl == 'function')
    return decl(propsWithChildren);

  const { children, is, ...props } = propsWithChildren;

  const attributes: Record<string, unknown> = {};
  const events: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props).filter(([, v]) => v != _undefined)) {
    if (k.startsWith("on"))
      events[k.slice(2)] = v;
    else
      attributes[k] = isFunction(v) ? derive(v) : v;

  }

  return new ZDomElement(decl, attributes, events, children, is);
}

export const jsx: typeof createElement = createElement;
export const jsxs: typeof createElement = createElement;
export const jsxDEV: typeof createElement = createElement;
