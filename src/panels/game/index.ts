import { mgl } from "#api/internal/mlg";
import { actionEmitter } from "#game/sceneController";
import { GameScene } from "#game/state";
import "#game/style.scss";
import { ActionGoToSceneType } from "#game/types";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog";

const panel = createPanel(
    "Game preview",
    `<div id="game-scene">
        <img id="background" alt="background">
        <div id="choices-container"></div>
        <div id="dialog-box"></div>
    </div>`,
    {
        width: 640,
        height: 500,
        top: 20,
        left: 20,
        minWidth: 480,
        minHeight: 300,
    }
);

export const mainScene = new GameScene(panel.qs("#game-scene"));
mgl.mainScene = mainScene;

actionEmitter.on("go-to-scene", async (cb, action: ActionGoToSceneType) => {
    uiMsg("Go to scene: " + action.scene);
    cb();
});
