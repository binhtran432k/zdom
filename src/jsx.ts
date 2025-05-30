import type { ZDomElement, ZDomState } from "./utils";

export namespace JSX {
  export type Element = ZDomJSXElementSingle | ZDomJSXElementSingle[];
  export type IntrinsicElements =
    BaseIntrinsicElements<HTMLElementTagNameMap>
    & BaseIntrinsicElements<SVGElementTagNameMap>
    & BaseIntrinsicElements<MathMLElementEventMap>;
}

export type ZDomJSXElementSingle =
  | ZDomElement
  | ZDomState
  | string
  | number
  | bigint
  | boolean
  | undefined
  | null
  | Node
  | Object;

export type ZDomJSXDecl = string | ((props: Record<string, unknown>) => JSX.Element);

export type PropsWithChildren<T = {}> = T & {
  children: JSX.Element;
}

type BaseIntrinsicElements<TagNameMap> = {
  [TagName in keyof TagNameMap]:
  { [k in Exclude<
    keyof TagNameMap[TagName],
    keyof CommonAttributes
    | keyof StrictCommonAttributes
    | keyof EventAttributes>]?: AttributeType<PrimitiveType> }
  & { [k in keyof CommonAttributes]?: AttributeType<CommonAttributes[k]>; }
  & { [k in keyof StrictCommonAttributes]?: StrictCommonAttributes[k]; }
  & { [Attribute in DashPrefixAttributeName<keyof ARIAMixin, "aria">]?: AttributeType<string>; }
  & EventAttributes
  & { [k in string]?: unknown; };
};

interface CommonAttributes {
  autocomplete: AutoFill;
  dir: "ltr" | "rtl" | "auto";
  draggable: "true" | "false";
  popover: "auto" | "hint" | "manual";

  action: string;
  alt: string;
  as: string;
  class: string;
  content: string;
  for: string;
  href: string;
  id: string;
  name: string;
  rel: string;
  src: string;
  style: string;
  role: string;
  target: string;
  title: string;
  type: string;

  cols: number;
  colspan: number;
  height: number;
  length: number;
  max: number;
  maxlength: number;
  min: number;
  minlength: number;
  rows: number;
  rowspan: number;
  tabindex: number;
  width: number;

  async: boolean;
  autoplay: boolean;
  checked: boolean;
  disabled: boolean
  required: boolean;
}

interface StrictCommonAttributes {
  children: JSX.Element;
  is: string;
  xmlns: HintedString<
    "http://www.w3.org/1999/xhtml"
    | "http://www.w3.org/2000/svg"
    | "http://www.w3.org/1998/Math/MathML">;
}

type DashPrefixAttributeName<
  S extends string,
  Prefix extends string,
> = S extends `${Prefix}${infer T}`
  ? `${Prefix}${T extends Capitalize<T> ? "-" : ""}${Lowercase<T>}`
  : Lowercase<S>;

type AttributeType<T> =
  (T extends string ? HintedString<T> : (T | string))
  | ZDomState<T>
  | ((...x: any) => T);

type EventAttributes<E extends keyof DocumentEventMap = keyof DocumentEventMap> = {
  [k in `on${E}`]?: EventAttributeType<((ev: DocumentEventMap[E]) => unknown)>;
};

type EventAttributeType<T> = T | ZDomState<T>;

type HintedString<T extends string> = T | (string & {});

type PrimitiveType = string | number | bigint | boolean | null | undefined;
