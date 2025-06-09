import { tag } from "./core";
import {
	type PropsWithChildren,
	type ZDomElement,
	type ZDomElementAttributes,
	type ZDomIntrinsicElements,
	_undefined,
	isFunction,
} from "./utils";

export namespace JSX {
	export type Element = ZDomElement;
	export type IntrinsicElements = ZDomIntrinsicElements;
}

type ZDomJSXDecl = string | ((props: Record<string, unknown>) => JSX.Element);

export const Fragment = (props: PropsWithChildren): JSX.Element =>
	props.children;

const createElement = (
	decl: ZDomJSXDecl,
	propsWithChildren: PropsWithChildren<ZDomElementAttributes>,
): JSX.Element => {
	if (isFunction(decl)) return decl(propsWithChildren);
	const { children, ...props } = propsWithChildren;
	return tag(decl, props, children);
};

export const jsx: typeof createElement = createElement;
export const jsxs: typeof createElement = createElement;
export const jsxDEV: typeof createElement = createElement;
