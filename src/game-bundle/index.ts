import { actionEmitter } from "#game/sceneController";
import { GameScene } from "#game/state";
import "#game/style.scss";
import { ActionBackgroundType } from "#game/types";
import "@wxn0brp/flanker-ui/html";
import { MenuUI } from "./menu-ui";
import { getSaves, SaveData, saveGameToSlot } from "./save";
import { SaveLoadUI } from "./save-ui";
import "./ui.scss";

let sceneName: string;
const scene = new GameScene(qs("#game-scene"));
const saveLoadUI = new SaveLoadUI();
const menuUI = new MenuUI();

async function loadScene(name: string) {
    sceneName = name;
    const res = await fetch(`./assets/scenes/${name}.json`).then(res => res.json());
    scene.sceneConfig = res;
    scene.dialogEngine.element.innerHTML = "";
    scene.choicesContainer.innerHTML = "";
}

function restoreSceneState(index: number) {
    for (let i = index; i >= 0; i--) {
        const action = scene.sceneConfig[i];
        if (action && action.type === "background") {
            scene.setBackground((action as ActionBackgroundType).url);
            break;
        }
    }
}

async function startGame(savedGame?: SaveData) {
    if (savedGame) {
        await loadScene(savedGame.sceneName);
        restoreSceneState(savedGame.lastIndex);
        scene.lastIndex.set(savedGame.lastIndex);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        await loadScene(urlParams.get("scene") || "master");
        scene.lastIndex.set(-1);
    }

    scene.pause.set(false);
    scene.nextStep();
}

async function handleSave() {
    scene.pause.set(true);
    const slot = await saveLoadUI.show("save");
    if (slot !== null) {
        saveGameToSlot(slot, {
            sceneName,
            lastIndex: scene.lastIndex.get(),
        });
    }
    scene.pause.set(false);
}

async function handleLoad() {
    scene.pause.set(true);
    const slot = await saveLoadUI.show("load");
    if (slot !== null) {
        const saves = getSaves();
        const savedGame = saves[slot];
        if (savedGame) {
            await startGame(savedGame);
        } else {
            scene.pause.set(false);
        }
    } else {
        scene.pause.set(false);
    }
}

actionEmitter.on("go-to-scene", async (cb, action: any) => {
    await loadScene(action.scene);
    scene.lastIndex.set(-1);
    scene.nextStep();
    cb();
});

window.addEventListener("keydown", async (e) => {
    if (e.key === "Escape" || e.key === "Backspace") {
        scene.pause.set(true);
        const action = await menuUI.show();
        switch (action) {
            case "save":
                await handleSave();
                break;
            case "load":
                await handleLoad();
                break;
            case "resume":
                scene.pause.set(false);
                break;
        }
    }
});


async function main() {
    const slot = await saveLoadUI.show("load");
    if (slot !== null) {
        const saves = getSaves();
        const savedGame = saves[slot];
        if (savedGame) {
            await startGame(savedGame);
        } else {
            await startGame();
        }
    } else {
        await startGame(); // New Game
    }
}

main();