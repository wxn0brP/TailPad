import VEE from "@wxn0brp/event-emitter";
import { GameScene } from "./state";
import { Action, ActionBackgroundType, ActionDelayType, ActionDialogChoiceType, ActionTextType } from "./types";

export const actionEmitter = new VEE<{
    [event: string]: (
        cb: (...args: any[]) => any,
        action: Action,
        scene: GameScene,
        index: number
    ) => void
}>();

export function sceneController(scene: GameScene) {
    scene.eventEmitter.on("run-scene", (index: number) => {
        scene.lastIndex.set(index);
        runScene(scene, scene.sceneConfig[index], index);
    });
}

async function runScene(scene: GameScene, action: Action, index: number) {
    if (!action) return console.error("No action", index, scene);

    if (action.noWaitForEnd) {
        actionEmitter.emit(action.type, () => { }, action, scene, index);
    } else {
        await new Promise((resolve) => {
            actionEmitter.emit(action.type, resolve, action, scene, index);
        });
    }

    if (index === scene.sceneConfig.length - 1) return scene.eventEmitter.emit("scenes-end");
    if (scene.pause.get()) return scene.eventEmitter.emit("pause", index);
    scene.eventEmitter.emit("run-scene", index + 1);
}

actionEmitter.on("text", async (cb, action: ActionTextType, scene) => {
    scene.dialogEngine.writeAndConfirm(action.text).then(cb);
});

actionEmitter.on("dialog-choice", async (cb, action: ActionDialogChoiceType, scene, index) => {
    scene.showChoices(action.choices).then(choice => {
        actionEmitter.emit("go-to-scene", () => { }, { type: "go-to-scene", scene: choice.scene }, scene, -index);
        cb();
    });

    if (action.text)
        scene.dialogEngine.write(action.text);
});

actionEmitter.on("background", async (cb, action: ActionBackgroundType, scene) => {
    scene.setBackground(action.url);
    cb();
});

actionEmitter.on("delay", async (cb, action: ActionDelayType) => {
    setTimeout(cb, action.ms);
});