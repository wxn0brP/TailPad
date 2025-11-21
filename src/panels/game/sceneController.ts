import VEE from "@wxn0brp/event-emitter";
import { selectPrompt, uiMsg } from "@wxn0brp/flanker-dialog";
import { GameScene } from "./state";
import { Action, ActionBackgroundType, ActionDelayType, ActionDialogChoiceType, ActionGoToSceneType, ActionTextType } from "./types";

export const actionEmitter = new VEE();

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

function register() {
    actionEmitter.on("text", async (cb, action: ActionTextType, scene: GameScene) => {
        scene.dialogEngine.write(action.text).then(cb);
    });

    actionEmitter.on("background", async (cb, action: ActionBackgroundType, scene: GameScene) => {
        scene.setBackground(action.url);
        cb();
    });

    actionEmitter.on("delay", async (cb, action: ActionDelayType) => {
        setTimeout(cb, action.ms);
    });

    actionEmitter.on("go-to-scene", async (cb, action: ActionGoToSceneType) => {
        uiMsg("Go to scene: " + action.scene);
        cb();
    });

    actionEmitter.on("dialog-choice", async (cb, action: ActionDialogChoiceType) => {
        const sceneName = await selectPrompt(action.text, action.choices.map(c => c.text), action.choices.map(c => c.scene));
        uiMsg("Go to scene: " + sceneName);
        cb();
    });
}

register();