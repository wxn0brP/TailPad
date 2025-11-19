import { mgl } from "#api/internal/mlg";
import { sceneController } from "./sceneController";
import { GameScene } from "./state";
import "./style.scss";

export const mainScene = new GameScene(qs("#game-scene"));
sceneController(mainScene);
mgl.mainScene = mainScene;