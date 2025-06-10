import { test } from "node:test";
import assert from "node:assert";
import zdom from "../src/nojsx";
import { prerender } from "../src/prerender";

const {
	a,
	body,
	br,
	button,
	div,
	head,
	hr,
	html,
	input,
	li,
	p,
	pre,
	script,
	span,
	style,
	title,
	ul,
} = zdom.tags;

test("tags", () => {
	assert.equal(
		prerender(() =>
			div!(
				p!("👋Hello"),
				ul!(li!("🗺️World"), li!(a!({ href: "https://vanjs.org/" }, "🍦VanJS"))),
			),
		),
		'<div><p>👋Hello</p><ul><li>🗺️World</li><li><a href="https://vanjs.org/">🍦VanJS</a></li></ul></div>',
	);
});

test("elements without child", () => {
	assert.equal(
		prerender(() => br!()),
		"<br>",
	);
	assert.equal(
		prerender(() => hr!({ class: "large" })),
		'<hr class="large">',
	);
	// Children are ignored even when they are provided
	assert.equal(
		prerender(() => br!(div!("Line"))),
		"<br>",
	);
});

test("boolean prop", () => {
	assert.equal(
		prerender(() => input!({ type: "checkbox", checked: false })),
		'<input type="checkbox">',
	);
	assert.equal(
		prerender(() => input!({ type: "checkbox", checked: true })),
		'<input type="checkbox" checked>',
	);
	assert.equal(
		prerender(() => input!({ checked: false })),
		"<input>",
	);
	assert.equal(
		prerender(() => input!({ checked: true })),
		"<input checked>",
	);
});

test("null prop", () => {
	assert.equal(
		prerender(() => div!({ id: null })),
		"<div></div>",
	);
});

test("undefined prop", () => {
	assert.equal(
		prerender(() => div!({ id: <any>undefined })),
		"<div></div>",
	);
});

test("escape", () => {
	assert.equal(
		prerender(() => p!("<input>")),
		"<p>&lt;input&gt;</p>",
	);
	assert.equal(
		prerender(() => div!("a && b")),
		"<div>a &amp;&amp; b</div>",
	);
	assert.equal(
		prerender(() => div!("<input a && b>")),
		"<div>&lt;input a &amp;&amp; b&gt;</div>",
	);
});

test("escapeAttr", () => {
	assert.equal(
		prerender(() => input!({ value: '"text"' })),
		'<input value="&quot;text&quot;">',
	);
});

test("don't escape script tag", () => {
	assert.equal(
		prerender(() => script!("console.log(a < b && c > d)")),
		"<script>console.log(a < b && c > d)</script>",
	);
});

test("don't escape style tag", () => {
	assert.equal(
		prerender(() => style!("ul > li { list-style-type: square; }")),
		"<style>ul > li { list-style-type: square; }</style>",
	);
});

test("nested children", () => {
	assert.equal(
		prerender(() => ul!([li!("Item 1"), li!("Item 2"), li!("Item 3")])),
		"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
	);
	// Deeply nested
	assert.equal(
		prerender(() => ul!([[li!("Item 1"), [li!("Item 2")]], li!("Item 3")])),
		"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
	);
});

test("null or undefined are ignored", () => {
	assert.equal(
		prerender(() =>
			ul!(li!("Item 1"), li!("Item 2"), undefined, li!("Item 3"), null),
		),
		"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
	);
	assert.equal(
		prerender(() =>
			ul!([li!("Item 1"), li!("Item 2"), undefined, li!("Item 3"), null]),
		),
		"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
	);
	// Deeply nested
	assert.equal(
		prerender(() =>
			ul!([
				[undefined, li!("Item 1"), null, [li!("Item 2")]],
				null,
				li!("Item 3"),
				undefined,
			]),
		),
		"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
	);
});

test("add basic", () => {
	prerender(() => {
		const dom = ul!() as Element;

		dom.append(...zdom.toDoms(li!("Item 1"), li!("Item 2")));
		assert.equal(dom.outerHTML, "<ul><li>Item 1</li><li>Item 2</li></ul>");

		dom.append(...zdom.toDoms(li!("Item 3"), li!("Item 4"), li!("Item 5"))),
			assert.equal(
				dom.outerHTML,
				"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li></ul>",
			);

		// No-op if no children specified
		dom.append();
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li></ul>",
		);

		return dom;
	});
});

test("add nested children", () => {
	prerender(() => {
		const dom = ul!() as Element;

		dom.append(...zdom.toDoms([li!("Item 1"), li!("Item 2")]));
		assert.equal(dom.outerHTML, "<ul><li>Item 1</li><li>Item 2</li></ul>");

		// Deeply nested
		dom.append(
			...zdom.toDoms([[li!("Item 3"), [li!("Item 4")]], li!("Item 5")]),
		);
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li></ul>",
		);

		// No-op if no children specified
		dom.append(...zdom.toDoms([[[]]]));
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li></ul>",
		);

		return dom;
	});
});

test("add: null or undefined are ignored", () => {
	prerender(() => {
		const dom = ul!() as Element;

		dom.append(
			...zdom.toDoms(
				li!("Item 1"),
				li!("Item 2"),
				undefined,
				li!("Item 3"),
				null,
			),
		);
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
		);

		dom.append(
			...zdom.toDoms([
				li!("Item 4"),
				li!("Item 5"),
				undefined,
				li!("Item 6"),
				null,
			]),
		);
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li><li>Item 6</li></ul>",
		);

		// Deeply nested
		dom.append(
			...zdom.toDoms([
				[undefined, li!("Item 7"), null, [li!("Item 8")]],
				null,
				li!("Item 9"),
				undefined,
			]),
		);
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li><li>Item 6</li><li>Item 7</li><li>Item 8</li><li>Item 9</li></ul>",
		);

		// No-op if no non-empty children specified
		dom.append(...zdom.toDoms([[null, [undefined]], undefined], null));
		assert.equal(
			dom.outerHTML,
			"<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li><li>Item 4</li><li>Item 5</li><li>Item 6</li><li>Item 7</li><li>Item 8</li><li>Item 9</li></ul>",
		);

		return dom;
	});
});

test("onclick handler", () => {
	{
		const dom = () => div!(button!({ onclick: 'alert("Hello")' }, "Click me"));
		assert.equal(
			prerender(dom),
			'<div><button onclick="alert(&quot;Hello&quot;)">Click me</button></div>',
		);
	}

	{
		// Function-valued onclick handler will be skipped
		const dom = () =>
			div!(button!({ onclick: () => alert("Hello") }, "Click me"));
		assert.equal(prerender(dom), "<div><button>Click me</button></div>");
	}
});

test("tags: svg", () => {
	const { circle, path, svg } = zdom.tags;
	const dom = () =>
		zdom.withNS("http://www.w3.org/2000/svg", () =>
			svg!(
				{ width: "16px", viewBox: "0 0 50 50" },
				circle!({
					cx: "25",
					cy: "25",
					r: "20",
					stroke: "black",
					"stroke-width": "2",
					fill: "yellow",
				}),
				circle!({
					cx: "16",
					cy: "20",
					r: "2",
					stroke: "black",
					"stroke-width": "2",
					fill: "black",
				}),
				circle!({
					cx: "34",
					cy: "20",
					r: "2",
					stroke: "black",
					"stroke-width": "2",
					fill: "black",
				}),
				path!({
					d: "M 15 30 Q 25 40, 35 30",
					stroke: "black",
					"stroke-width": "2",
					fill: "transparent",
				}),
			),
		);
	assert.equal(
		prerender(dom),
		'<svg width="16px" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="black" stroke-width="2" fill="yellow"/><circle cx="16" cy="20" r="2" stroke="black" stroke-width="2" fill="black"/><circle cx="34" cy="20" r="2" stroke="black" stroke-width="2" fill="black"/><path d="M 15 30 Q 25 40, 35 30" stroke="black" stroke-width="2" fill="transparent"/></svg>',
	);
});

test("tags: math", () => {
	const { math, mi, mn, mo, mrow, msup } = zdom.tags;
	const dom = () =>
		zdom.withNS("http://www.w3.org/1998/Math/MathML", () =>
			math!(
				msup!(mi!("e"), mrow!(mi!("i"), mi!("π"))),
				mo!("+"),
				mn!("1"),
				mo!("="),
				mn!("0"),
			),
		);
	assert.equal(
		prerender(dom),
		"<math><msup><mi>e</mi><mrow><mi>i</mi><mi>π</mi></mrow></msup><mo>+</mo><mn>1</mn><mo>=</mo><mn>0</mn></math>",
	);
});

test("dummy reactive", () => {
	const state1 = zdom.state(1),
		state2 = zdom.derive(() => state1.val * 2);
	const state3 = zdom.state("abc"),
		state4 = zdom.derive(() => state3.val.repeat(2));
	const state5 = zdom.state(false),
		state6 = zdom.derive(() => !state5.val);

	const dom = () =>
		div!(
			state1,
			span!(state2),
			p!(() => `Prefix - ${state3.val}`),
			() => `${state4.oldVal} - Suffix`,
			p!(
				{
					"data-index": state1,
					"data-id": () => state2.val + 2,
					"data-title": state3,
					"data-text": () => `Prefix - ${state4.rawVal} - Suffix`,
				},
				() => state1.val,
				() => state2.oldVal,
				state3,
				() => state4.val,
			),
			button!(
				{
					onclick: zdom.derive(() =>
						state5.val ? 'console.log("Hello")' : 'alert("Hello")',
					),
				},
				"Button1",
			),
			button!(
				{
					onclick: zdom.derive(() =>
						state6.val ? () => console.log("Hello") : () => alert("Hello"),
					),
				},
				"Button2",
			),
			() => (state5.val ? pre : div)!(state3),
			() => (state6.rawVal ? pre : div)!(state4),
		);
	assert.equal(
		prerender(dom),
		'<div>1<span>2</span><p>Prefix - abc</p>abcabc - Suffix<p data-index="1" data-id="4" data-title="abc" data-text="Prefix - abcabc - Suffix">12abcabcabc</p><button onclick="alert(&quot;Hello&quot;)">Button1</button><button>Button2</button><div>abc</div><pre>abcabc</pre></div>',
	);
});

test("html", () => {
	assert.equal(
		prerender(() => html!(head!(title!("Hello")), body!(div!("World"))), {
			html: 1,
		}),
		"<!DOCTYPE html><html><head><title>Hello</title></head><body><div>World</div></body></html>",
	);
	assert.equal(
		prerender(
			() => html!({ lang: "en" }, head!(title!("Hello")), body!(div!("World"))),
			{ html: 1 },
		),
		'<!DOCTYPE html><html lang="en"><head><title>Hello</title></head><body><div>World</div></body></html>',
	);
});

// Test cases for examples used in the documentation. Having the tests to ensure the examples
// are always correct.
test("example: van-plate-server", () => {
	assert.equal(
		prerender(() => a!({ href: "https://vanjs.org/" }, "🍦VanJS")),
		`<a href="https://vanjs.org/">🍦VanJS</a>`,
	);
	assert.equal(
		prerender(() => button!({ onclick: 'alert("Hello")' }, "Click")),
		`<button onclick="alert(&quot;Hello&quot;)">Click</button>`,
	);
	assert.equal(
		prerender(() => input!({ type: "text", value: "Value" })),
		`<input type="text" value="Value">`,
	);
});
