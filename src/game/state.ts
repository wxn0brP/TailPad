import VEE from "@wxn0brp/event-emitter";
import { DialogEngine } from "./dialog";
import { Action, Choice } from "./types";
import { GameEvents } from "./events";
import { ReactiveCell } from "@wxn0brp/flanker-ui";
import { sceneController } from "./sceneController";

export class GameScene {
    element: HTMLDivElement;
    background: HTMLImageElement;
    dialogEngine: DialogEngine;
    eventEmitter = new VEE<GameEvents>();
    choicesContainer: HTMLDivElement;

    sceneConfig: Action[] = [];
    lastIndex = new ReactiveCell(-1);
    pause = new ReactiveCell(true);

    constructor(element: HTMLDivElement) {
        this.element = element;
        this.background = element.qs("#background");
        this.dialogEngine = new DialogEngine(element.qs("#dialog-box"), this.pause);
        this.choicesContainer = element.qs("#choices-container");
        sceneController(this);
    }

    setBackground(url: string) {
        this.background.src = url;
    }

    showChoices(choices: Choice[]): Promise<Choice> {
        this.choicesContainer.innerHTML = "";
        return new Promise((resolve) => {
            for (const choice of choices) {
                const button = document.createElement("button");
                button.textContent = choice.text;
                button.onclick = () => {
                    this.choicesContainer.innerHTML = "";
                    resolve(choice);
                };
                this.choicesContainer.appendChild(button);
            }
        });
    }

    nextStep() {
        this.eventEmitter.emit("run-scene", this.lastIndex.get() + 1);
    }
}