export class DialogEngine {
    constructor(public element: HTMLDivElement, public speed = 25) { }

    async write(text: string) {
        this.element.innerHTML = "";
        for (const ch of text) {
            this.element.innerHTML += ch;
            await new Promise((resolve) => setTimeout(resolve, this.speed));
        }
    }
}