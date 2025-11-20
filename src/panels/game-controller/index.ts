import { mainScene } from "#panels/game";
import { createPanel } from "#panels/createPanel";
import { watchCheckbox } from "@wxn0brp/flanker-ui/component/helpers";

const panel = createPanel(
    "Game controller",
    `<div>
        <button class="btn" data-id="next-step">Next step</button>
        <button class="btn" data-id="reset-step">Reset</button>
        <br>
        <br>
        <label>
            Scene index:
            <input data-id="scene-index" type="number" value="-1">
        </label>
        <br>
        <label>
            Pause:
            <input data-id="pause" type="checkbox" checked>
        </label>
    </div>`,
    {
        height: 300,
        width: 640,
        left: 20,
        top: 550,
        minHeight: 100,
        minWidth: 200,
    }
);

panel.qs("next-step", 1).addEventListener("click", () => {
    mainScene.nextStep();
});

panel.qs("reset-step", 1).addEventListener("click", () => {
    mainScene.background.src = "";
    mainScene.dialogEngine.element.innerHTML = "";
    mainScene.eventEmitter.emit("run-scene", 0);
});

const sceneIndexInput = panel.qi("scene-index", 1);

sceneIndexInput.addEventListener("input", () => {
    mainScene.eventEmitter.emit("run-scene", sceneIndexInput.valueAsNumber);
});

mainScene.lastIndex.subscribe(index => {
    sceneIndexInput.valueAsNumber = index;
});

watchCheckbox(panel.qi("pause", 1), mainScene.pause);
mainScene.pause.set(true);
mainScene.lastIndex.set(-1);