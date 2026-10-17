import { delay } from "@wxn0brp/flanker-ui/utils";
import { ReactiveCell } from "@wxn0brp/flanker-ui";
import { VariableManager } from "./variables";
import { RICH_TAG_ELEMENTS, parseRichText } from "./richText";

const CONFIRM_AUTO_DELAY = 1500;
const SKIP_DELAY = 200;
const HOLD_DELAY = 2500;

export class DialogEngine {
	constructor(
		public element: HTMLDivElement,
		private pause: ReactiveCell<boolean>,
		public speed = 25,
		private skip?: ReactiveCell<boolean>,
		private auto?: ReactiveCell<boolean>,
		private variables?: VariableManager,
	) {}

	_writing = 0;
	history: string[] = [];
	private _confirmCleanup: (() => void) | null = null;
	private _confirmResolve: (() => void) | null = null;

	async _writeText(text: string) {
		this.element.innerHTML = "";
		const id = ++this._writing;
		const tokens = parseRichText(text, this.variables?.getAll() ?? {});
		const stack: Element[] = [
			this.element,
		];

		for (const token of tokens) {
			if (this._writing !== id) return; // abort

			if (token.type === "open") {
				const element = document.createElement(
					RICH_TAG_ELEMENTS[token.tag] ?? "span",
				);
				if (token.style) element.setAttribute("style", token.style);
				stack[stack.length - 1].appendChild(element);
				stack.push(element);
				continue;
			}

			if (token.type === "close") {
				if (stack.length > 1) stack.pop();
				continue;
			}

			const parent = stack[stack.length - 1];
			for (const ch of token.value) {
				if (this._writing !== id) return; // abort
				if (ch === "\n") {
					parent.appendChild(document.createElement("br"));
				} else {
					let last = parent.lastChild;
					if (!last || last.nodeType !== Node.TEXT_NODE) {
						last = document.createTextNode("");
						parent.appendChild(last);
					}
					(last as Text).data += ch;
				}
				await delay(this.speed);
			}
		}

		this.history.push(text);
	}

	async write(text: string) {
		const pending = this._writeText(text);
		const token = this._writing;
		await pending;
		if (this._writing !== token) return;
		await delay(this.skip?.get() ? SKIP_DELAY : HOLD_DELAY);
	}

	async writeAndConfirm(text: string) {
		const pending = this._writeText(text);
		const token = this._writing;
		await pending;
		if (this._writing !== token) return;

		return new Promise<void>(resolve => {
			let timer: ReturnType<typeof setTimeout> | null = null;
			const cleanup = () => {
				window.removeEventListener("click", onClick);
				document.removeEventListener("keydown", onKeyDown);
				if (timer) clearTimeout(timer);
				this._confirmCleanup = null;
				this._confirmResolve = null;
			};
			this._confirmCleanup = cleanup;
			this._confirmResolve = resolve;

			const onClick = (e: MouseEvent) => {
				if (this.pause.get()) return;

				const target = e.target as HTMLElement;
				if (target.closest("#dialog-box") || target.id === "background") {
					cleanup();
					resolve();
				}
			};

			const onKeyDown = (e: KeyboardEvent) => {
				if (this.pause.get()) return;

				if (e.code === "Space" || e.code === "Enter") {
					cleanup();
					resolve();
				}
			};

			window.addEventListener("click", onClick);
			document.addEventListener("keydown", onKeyDown);

			if (this.auto?.get()) {
				timer = setTimeout(() => {
					cleanup();
					resolve();
				}, CONFIRM_AUTO_DELAY);
			}
		});
	}

	cancel() {
		const confirmResolve = this._confirmResolve;
		this._confirmCleanup?.();
		this._writing++;
		this.element.innerHTML = "";
		confirmResolve?.();
	}
}
