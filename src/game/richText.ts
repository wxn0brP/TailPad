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

export const RICH_TAG_ELEMENTS: Record<string, string> = {
	b: "b",
	i: "i",
	u: "u",
	s: "s",
	color: "span",
};

const TAG_PATTERN = /\[(\/?)([a-zA-Z]+)(?:=([^\]]+))?\]/g;
const VAR_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

function interpolate(
	text: string,
	variables: Record<string, string | number | boolean> = {},
): string {
	return text.replace(VAR_PATTERN, (match, name) =>
		Object.hasOwn(variables, name) ? String(variables[name]) : match,
	);
}

export function parseRichText(
	text: string,
	variables: Record<string, string | number | boolean> = {},
): RichToken[] {
	const source = interpolate(text ?? "", variables);
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
