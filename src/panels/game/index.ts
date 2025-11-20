import { mgl } from "#api/internal/mlg";
import { createPanel } from "#panels/createPanel";
import { sceneController } from "./sceneController";
import { GameScene } from "./state";
import "./style.scss";

const panel = createPanel(
    "Game preview",
    `<div id="game-scene">
        <img id="background" alt="background">
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
sceneController(mainScene);
mgl.mainScene = mainScene;