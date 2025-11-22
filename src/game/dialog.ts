import { delay } from "@wxn0brp/flanker-ui/utils";

export class DialogEngine {
    constructor(public element: HTMLDivElement, public speed = 25) { }

    _writing = 0;

    async _writeText(text: string) {
        this.element.innerHTML = "";
        const now = Date.now();
        this._writing = now;

        for (const ch of text) {
            if (this._writing !== now) return; // abort
            this.element.innerHTML += ch;
            await delay(this.speed);
        }
    }

    async write(text: string) {
        await this._writeText(text);
        await delay(2500);
    }

    async writeAndConfirm(text: string) {
        await this._writeText(text);

        return new Promise<void>((resolve) => {
            const onClick = () => {
                window.removeEventListener("click", onClick);
                document.removeEventListener("keydown", onKeyDown);
                resolve();
            };

            const onKeyDown = (e: KeyboardEvent) => {
                if (e.code === "Space" || e.code === "Enter") onClick();
            };

            window.addEventListener("click", onClick);
            document.addEventListener("keydown", onKeyDown);
        });
    }
}