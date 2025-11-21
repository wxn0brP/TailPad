import { actionEmitter } from "#game/sceneController";
import { GameScene } from "#game/state";
import "#game/style.scss";
import "@wxn0brp/flanker-ui/html";

async function loadScene(name: string) {
    const res = await fetch(`./assets/scenes/${name}.json`).then(res => res.json());
    scene.sceneConfig = res;
}

const scene = new GameScene(qs("#game-scene"));
scene.sceneConfig = [];

const urlParams = new URLSearchParams(window.location.search);
const sceneName = urlParams.get("scene");
await loadScene(sceneName || "master");

actionEmitter.on("go-to-scene", async (cb, action: any) => {
    await loadScene(action.scene);
    scene.lastIndex.set(-1);
    scene.nextStep();
    cb();
});

scene.pause.set(false);
scene.nextStep();