import { initializePanels } from "#api/internal/panels";
import { root } from "#api/internal/state";
import { render } from "#api/internal/utils";
import "#api/internal/yjs";
import "#panels/editor-panel";
import { mainScene } from "#panels/game";
import "#panels/game-controller";
import "#panels/graphical-editor-panel";
import "#panels/scene-manager-panel";
import "#style.scss";
import "@wxn0brp/flanker-dialog/style.css";
import "@wxn0brp/flanker-ui/html";

initializePanels();
render();

root.observeDeep(() => {
    const value = root.get("data");
    mainScene.sceneConfig = value?.sceneConfig ?? [];
});