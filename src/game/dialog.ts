import { delay } from "@wxn0brp/flanker-ui/utils";
import { ReactiveCell } from "@wxn0brp/flanker-ui";
import { VariableManager } from "./variables";
import {
	createRichElement,
	parseRichText,
	renderRichText,
	resolveRichText,
} from "./richText";

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
	private _typing = false;
	private _resolvedText: string | null = null;
	private _confirmCleanup: (() => void) | null = null;
	private _confirmResolve: (() => void) | null = null;

	async _writeText(text: string) {
		this.element.innerHTML = "";
		const id = ++this._writing;
		const resolved = resolveRichText(text, this.variables?.getAll() ?? {});
		const tokens = parseRichText(resolved);
		this._typing = true;
		this._resolvedText = resolved;

		const stack: {
			element: Element;
			tag?: string;
		}[] = [
			{
				element: this.element,
			},
		];

		for (const token of tokens) {
			if (this._writing !== id || !this._typing) return; // abort

			if (token.type === "open") {
				const element = createRichElement(token);
				stack[stack.length - 1].element.appendChild(element);
				stack.push({
					element,
					tag: token.tag,
				});
				continue;
			}

			if (token.type === "close") {
				if (stack.length > 1 && stack[stack.length - 1].tag === token.tag)
					stack.pop();
				continue;
			}

			const parent = stack[stack.length - 1].element;
			for (const ch of token.value) {
				if (this._writing !== id || !this._typing) return; // abort
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

		if (this._writing !== id || !this._typing) return;
		this._typing = false;
		this._resolvedText = null;
		this.history.push(resolved);
	}

	/** Reveals the whole text immediately, aborting the typing animation. */
	finishWriting() {
		if (!this._typing || this._resolvedText === null) return;
		const text = this._resolvedText;
		this._typing = false;
		this._resolvedText = null;
		this.element.innerHTML = "";
		this.element.appendChild(renderRichText(text));
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

		return new Promise<void>(resolve => {
			let timer: ReturnType<typeof setTimeout> | null = null;
			let active = true;

			const cleanup = () => {
				active = false;
				window.removeEventListener("click", onClick);
				document.removeEventListener("keydown", onKeyDown);
				if (timer) clearTimeout(timer);
				this._confirmCleanup = null;
				this._confirmResolve = null;
			};

			const advance = () => {
				if (!active || this.pause.get()) return;

				if (this._typing) {
					this.finishWriting();
					return;
				}

				cleanup();
				resolve();
			};

			const onClick = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (target.closest("#dialog-box") || target.id === "background")
					advance();
			};

			const onKeyDown = (e: KeyboardEvent) => {
				if (e.code === "Space" || e.code === "Enter") advance();
			};

			this._confirmCleanup = cleanup;
			this._confirmResolve = resolve;
			window.addEventListener("click", onClick);
			document.addEventListener("keydown", onKeyDown);

			void pending.then(() => {
				if (!active) return;

				if (this._writing !== token) {
					cleanup();
					resolve();
					return;
				}

				if (this.auto?.get()) {
					timer = setTimeout(() => {
						if (!active) return;
						cleanup();
						resolve();
					}, CONFIRM_AUTO_DELAY);
				}
			});
		});
	}

	/** Drops pending input and typing, leaving the confirm promise unsettled. */
	abort(clearHistory = false) {
		this._confirmCleanup?.();
		this._writing++;
		this._typing = false;
		this._resolvedText = null;
		this.element.innerHTML = "";
		if (clearHistory) this.history = [];
	}

	cancel() {
		const confirmResolve = this._confirmResolve;
		this._confirmCleanup?.();
		this._writing++;
		this._typing = false;
		this._resolvedText = null;
		this.element.innerHTML = "";
		confirmResolve?.();
	}
}
