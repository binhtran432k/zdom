import { newZDomElement } from "./core";
import type { JSX, PropsWithChildren, ZDomJSXDecl } from "./jsx";
import { _undefined, isFunction } from "./utils";

export type { JSX } from "./jsx";

export const Fragment = (props: PropsWithChildren): JSX.Element =>
  props.children;

const createElement = (
  decl: ZDomJSXDecl,
  propsWithChildren: PropsWithChildren<Record<string, unknown>>,
): JSX.Element => {
  if (isFunction(decl))
    return decl(propsWithChildren);
  const { children, ...props } = propsWithChildren;
  return newZDomElement([decl, props, children]);
}

export const jsx: typeof createElement = createElement;
export const jsxs: typeof createElement = createElement;
export const jsxDEV: typeof createElement = createElement;
