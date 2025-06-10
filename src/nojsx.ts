import { derive, state, tag, toDoms, withNS } from "./core";
import {
	type HintedString,
	type ZDomElement,
	type ZDomElementAttributes,
	type ZDomIntrinsicElements,
	_undefined,
	isObject,
} from "./utils";

export type TagFunc = (
	props?: ZDomElementAttributes | ZDomElement,
	...children: ZDomElement[]
) => ZDomElement;

export type SmartTagFunc = (
	name: HintedString<keyof ZDomIntrinsicElements>,
	...rest: Parameters<TagFunc>
) => ReturnType<TagFunc>;

export interface ZDomTags extends SmartTagFunc {
	[k: string]: TagFunc;
}

export interface ZDom {
	derive: typeof derive;
	state: typeof state;
	tags: ZDomTags;
	withNS: typeof withNS;
	toDoms: typeof toDoms;
}

const smartTag: SmartTagFunc = (name, ...args) => {
	const [props, ...children] = isObject(args[0] ?? 0) ? args : [{}, args];
	return tag(name, props as ZDomElementAttributes, ...children);
};

const tags = new Proxy(smartTag, {
	get: (x, name) => x.bind(_undefined, name as string),
}) as ZDomTags;

const zdom: ZDom = {
	derive,
	state,
	tags,
	withNS,
	toDoms,
};

export default zdom;
