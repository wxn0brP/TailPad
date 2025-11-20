import { uiMsg } from "@wxn0brp/flanker-dialog";
import { GameScene } from "./state";
import { Action, ActionBase } from "./types";

export function sceneController(scene: GameScene) {
    scene.eventEmitter.on("run-scene", (index: number) => {
        scene.lastIndex.set(index);
        runScene(scene, scene.sceneConfig[index], index);
    });
}

async function waitForEnd(action: ActionBase, cb: (...args: any[]) => Promise<any>, ...args: any[]) {
    const promise = cb(...args);
    if (!action.noWaitForEnd) await promise;
    return Promise.resolve();
}

async function runScene(scene: GameScene, action: Action, index: number) {
    if (!action) return console.error("No action", index, scene);
    switch (action.type) {
        case "text":
            await waitForEnd(action, () => scene.dialogEngine.write(action.text));
            break;
        case "background":
            scene.setBackground(action.url);
            break;
        case "delay":
            await waitForEnd(action, () => new Promise((resolve) => setTimeout(resolve, action.ms)));
            break;
        case "go-to-scene":
            uiMsg("Go to scene: " + action.scene);
            break;
        default:
            const n: never = action;
            throw new Error(`Unknown action type: ${n}`);
    }

    if (index === scene.sceneConfig.length - 1) return scene.eventEmitter.emit("scenes-end");
    if (scene.pause.get()) return scene.eventEmitter.emit("pause", index);
    scene.eventEmitter.emit("run-scene", index + 1);
}