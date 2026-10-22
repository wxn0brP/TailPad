export type RichToken =
	| {
			type: "text";
			value: string;
	  }
	| {
			type: "open";
			tag: string;
			style?: string;
	  }
	| {
			type: "close";
			tag: string;
	  };

export type RichOpenToken = Extract<
	RichToken,
	{
		type: "open";
	}
>;

export const RICH_TAG_ELEMENTS: Record<string, string> = {
	b: "b",
	i: "i",
	u: "u",
	s: "s",
	color: "span",
};

const TAG_PATTERN = /\[(\/?)([a-zA-Z]+)(?:=([^\]]+))?\]/g;
const VAR_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

/** Replaces `{variable}` placeholders with current values. */
export function resolveRichText(
	text: string,
	variables: Record<string, string | number | boolean> = {},
): string {
	return (text ?? "").replace(VAR_PATTERN, (match, name) =>
		Object.hasOwn(variables, name) ? String(variables[name]) : match,
	);
}

export function parseRichText(
	text: string,
	variables: Record<string, string | number | boolean> = {},
): RichToken[] {
	const source = resolveRichText(text, variables);
	const tokens: RichToken[] = [];
	let lastIndex = 0;

	for (const match of source.matchAll(TAG_PATTERN)) {
		const [raw, closing, rawTag, attribute] = match;
		const tag = rawTag.toLowerCase();
		if (!RICH_TAG_ELEMENTS[tag]) continue;

		const index = match.index ?? 0;
		if (index > lastIndex)
			tokens.push({
				type: "text",
				value: source.slice(lastIndex, index),
			});

		if (closing) {
			tokens.push({
				type: "close",
				tag,
			});
		} else {
			const style =
				tag === "color" && attribute ? `color: ${attribute}` : undefined;
			tokens.push({
				type: "open",
				tag,
				style,
			});
		}

		lastIndex = index + raw.length;
	}

	if (lastIndex < source.length)
		tokens.push({
			type: "text",
			value: source.slice(lastIndex),
		});

	return tokens;
}

export function createRichElement(token: RichOpenToken): Element {
	const element = document.createElement(
		RICH_TAG_ELEMENTS[token.tag] ?? "span",
	);
	if (token.style) element.setAttribute("style", token.style);
	return element;
}

/** Builds a DOM fragment with the same formatting the dialog box renders. */
export function renderRichText(
	text = "",
	variables: Record<string, string | number | boolean> = {},
): DocumentFragment {
	const fragment = document.createDocumentFragment();
	const stack: {
		element: Element | DocumentFragment;
		tag?: string;
	}[] = [
		{
			element: fragment,
		},
	];

	for (const token of parseRichText(text, variables)) {
		const top = stack[stack.length - 1];

		if (token.type === "open") {
			const element = createRichElement(token);
			top.element.appendChild(element);
			stack.push({
				element,
				tag: token.tag,
			});
			continue;
		}

		if (token.type === "close") {
			if (stack.length > 1 && top.tag === token.tag) stack.pop();
			continue;
		}

		appendPlainText(top.element, token.value);
	}

	return fragment;
}

export function appendPlainText(
	parent: Element | DocumentFragment,
	text: string,
) {
	const lines = text.split("\n");
	for (let i = 0; i < lines.length; i++) {
		if (i > 0) parent.appendChild(document.createElement("br"));
		if (lines[i]) parent.appendChild(document.createTextNode(lines[i]));
	}
}
