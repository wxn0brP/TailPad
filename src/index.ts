import "@wxn0brp/flanker-ui/html";

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
import { controller } from "@wxn0brp/nya-dock";
import "@wxn0brp/nya-dock/style.css";

render();
const panelsContainer = qs("#panels-container");
controller.master = panelsContainer;

controller.setDefaultState([
    "graphical-editor-panel",
    [
        "game-panel",
        [
            [
                "editor-panel",
                "game-controller-panel",
                1
            ],
            "scene-manager-panel",
        ],
        1
    ]
]);

document.querySelectorAll<HTMLDivElement>(".panel").forEach(panel => controller.registerPanel(panel.id, panel));

controller.init();
controller.reset()

root.observeDeep(() => {
    const value = root.get("data");
    mainScene.sceneConfig = value?.sceneConfig ?? [];
});
