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
    return action.waitForEnd ? await promise : promise;
}

async function runScene(scene: GameScene, action: Action, index: number) {
    if (!action) return console.error("No action", index, scene);
    switch (action.type) {
        case "text":
            await waitForEnd(action, typeText, scene, action.text);
            break;
        case "background":
            scene.setBackground(action.url);
            break;
        default:
            const n: never = action;
            throw new Error(`Unknown action type: ${n}`);
    }

    if (index === scene.sceneConfig.length - 1) return scene.eventEmitter.emit("scenes-end");
    if (scene.pause) return scene.eventEmitter.emit("pause", index);
    scene.eventEmitter.emit("run-scene", index + 1);
}

async function typeText(scene: GameScene, text: string) {
    await scene.dialogEngine.write(text);
}