import { render, updateData } from "#api/internal/utils";
import "#api/internal/yjs";
import { initializePanels } from "#api/internal/panels";
import "#style.scss";
import "@wxn0brp/flanker-dialog/style.css";
import "@wxn0brp/flanker-ui/html";
import { mainScene } from "#panels/game";
import { root } from "#api/internal/state";
import "#panels/game-controller";

initializePanels();
render();

root.observeDeep(() => {
    const value = root.get("data");
    mainScene.sceneConfig = value?.sceneConfig ?? [];
});