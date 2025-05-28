import type { ZDomElement, ZDomState } from "./core";

export namespace JSX {
  export type Element = ZDomJSXElementSingle | ZDomJSXElementSingle[];
  export type IntrinsicElements =
    BaseIntrinsicElements<HTMLElementTagNameMap>
    & BaseIntrinsicElements<SVGElementTagNameMap>
    & BaseIntrinsicElements<MathMLElementEventMap>;
}

export type ZDomJSXElementSingle =
  ZDomElement
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
  [TagName in keyof TagNameMap]: {
    [Attribute in Exclude<
      keyof TagNameMap[TagName],
      keyof HintedAttributes
      | keyof EventAttributes
      | "className"
      | "children"
      | KeyofIncludeType<TagNameMap[TagName], Function>>
    ]?: PrimitiveType | ZDomState;
  } & {
    [k in keyof HintedAttributes]?: HintedAttributes[k] | ZDomState;
  } & EventAttributes & {
    children?: JSX.Element;
  } & {
    [k in string]?: unknown;
  };
};

interface HintedAttributes {
  xmlns: HintedString<
    "http://www.w3.org/1999/xhtml"
    | "http://www.w3.org/2000/svg"
    | "http://www.w3.org/1998/Math/MathML">;

  class: string;
  style: string;
}

type EventAttributes<E extends keyof DocumentEventMap = keyof DocumentEventMap> = {
  [k in `on${E}`]?: ((ev: DocumentEventMap[E]) => void) | ZDomState;
};

type HintedString<T extends string> = T | (string & {});

type PrimitiveType = string | number | boolean | null | undefined;

type KeyofIncludeType<M, I> =
  { [K in keyof M]: M[K] extends I ? K : never }[keyof M];
