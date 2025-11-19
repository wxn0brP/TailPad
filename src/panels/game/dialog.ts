import { delay } from "@wxn0brp/flanker-ui/utils";

export class DialogEngine {
    constructor(public element: HTMLDivElement, public speed = 25) { }

    _writing = 0;

    async write(text: string) {
        this.element.innerHTML = "";

        const now = Date.now();
        this._writing = now;

        for (const ch of text) {
            if (this._writing !== now) return; // abort
            this.element.innerHTML += ch;
            await delay(this.speed);
        }

        await delay(2500);
    }
}