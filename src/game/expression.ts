export type ExpressionValue = string | number | boolean;

export interface ExpressionContext {
	variables?: Record<string, ExpressionValue>;
	visited?: (scene: string) => boolean;
	has?: (item: string) => boolean;
	flag?: (name: string) => boolean;
}

type Token =
	| {
			type: "num";
			value: number;
	  }
	| {
			type: "str";
			value: string;
	  }
	| {
			type: "ident";
			value: string;
	  }
	| {
			type: "op";
			value: string;
	  };

const COMPARISONS = [
	"==",
	"!=",
	">=",
	"<=",
	">",
	"<",
];

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < input.length) {
		const ch = input[i];

		if (/\s/.test(ch)) {
			i++;
			continue;
		}

		if (ch === '"' || ch === "'") {
			const quote = ch;
			let value = "";
			i++;
			while (i < input.length && input[i] !== quote) {
				if (input[i] === "\\" && i + 1 < input.length) i++;
				value += input[i];
				i++;
			}
			i++;
			tokens.push({
				type: "str",
				value,
			});
			continue;
		}

		if (/[0-9]/.test(ch)) {
			let raw = "";
			while (i < input.length && /[0-9.]/.test(input[i])) raw += input[i++];
			tokens.push({
				type: "num",
				value: Number(raw),
			});
			continue;
		}

		if (/[a-zA-Z_]/.test(ch)) {
			let name = "";
			while (i < input.length && /[a-zA-Z0-9_]/.test(input[i]))
				name += input[i++];
			tokens.push({
				type: "ident",
				value: name,
			});
			continue;
		}

		const two = input.slice(i, i + 2);
		if (
			[
				"==",
				"!=",
				">=",
				"<=",
				"&&",
				"||",
			].includes(two)
		) {
			tokens.push({
				type: "op",
				value: two,
			});
			i += 2;
			continue;
		}

		tokens.push({
			type: "op",
			value: ch,
		});
		i++;
	}

	return tokens;
}

function compare(left: ExpressionValue, op: string, right: ExpressionValue) {
	switch (op) {
		case "==":
			return left === right;
		case "!=":
			return left !== right;
	}

	const bothNumbers = typeof left === "number" && typeof right === "number";
	const bothStrings = typeof left === "string" && typeof right === "string";
	if (!bothNumbers && !bothStrings) return false;

	switch (op) {
		case ">":
			return left > right;
		case "<":
			return left < right;
		case ">=":
			return left >= right;
		case "<=":
			return left <= right;
		default:
			return false;
	}
}

class Parser {
	private pos = 0;

	constructor(
		private tokens: Token[],
		private ctx: ExpressionContext,
	) {}

	private peek() {
		return this.tokens[this.pos];
	}

	private next() {
		return this.tokens[this.pos++];
	}

	private isOp(value: string) {
		const token = this.peek();
		return token?.type === "op" && token.value === value;
	}

	parse(): ExpressionValue {
		return this.parseOr();
	}

	private parseOr(): ExpressionValue {
		let left = this.parseAnd();
		while (this.isOp("||")) {
			this.next();
			const right = this.parseAnd();
			left = Boolean(left) || Boolean(right);
		}
		return left;
	}

	private parseAnd(): ExpressionValue {
		let left = this.parseNot();
		while (this.isOp("&&")) {
			this.next();
			const right = this.parseNot();
			left = Boolean(left) && Boolean(right);
		}
		return left;
	}

	private parseNot(): ExpressionValue {
		if (this.isOp("!")) {
			this.next();
			return !this.parseNot();
		}
		return this.parseComparison();
	}

	private parseComparison(): ExpressionValue {
		const left = this.parsePrimary();
		const token = this.peek();
		if (token?.type === "op" && COMPARISONS.includes(token.value)) {
			this.next();
			const right = this.parsePrimary();
			return compare(left, token.value, right);
		}
		return left;
	}

	private parsePrimary(): ExpressionValue {
		const token = this.next();
		if (!token) return false;

		if (token.type === "num" || token.type === "str") return token.value;

		if (token.type === "ident") {
			if (this.isOp("(")) return this.parseCall(token.value);
			if (token.value === "true") return true;
			if (token.value === "false") return false;
			return this.ctx.variables?.[token.value] ?? false;
		}

		if (token.type === "op" && token.value === "(") {
			const value = this.parseOr();
			if (!this.isOp(")")) throw new Error("Expected )");
			this.next();
			return value;
		}

		return false;
	}

	private parseCall(name: string): ExpressionValue {
		this.next(); // consume (
		const args: ExpressionValue[] = [];
		if (!this.isOp(")")) {
			let more = true;
			while (more) {
				args.push(this.parseOr());
				if (this.isOp(",")) this.next();
				else more = false;
			}
		}
		if (!this.isOp(")")) throw new Error("Expected )");
		this.next();
		return this.callFunction(name, args);
	}

	private callFunction(name: string, args: ExpressionValue[]): ExpressionValue {
		const first = String(args[0] ?? "");
		switch (name) {
			case "visited":
				return this.ctx.visited?.(first) ?? false;
			case "has":
				return this.ctx.has
					? this.ctx.has(first)
					: Object.hasOwn(this.ctx.variables ?? {}, first);
			case "flag":
				return this.ctx.flag
					? this.ctx.flag(first)
					: Boolean(this.ctx.variables?.[first]);
			default:
				return false;
		}
	}
}

export function evaluateExpression(
	expression: string,
	ctx: ExpressionContext = {},
): boolean {
	if (!expression?.trim()) return false;
	try {
		return Boolean(new Parser(tokenize(expression), ctx).parse());
	} catch {
		return false;
	}
}
