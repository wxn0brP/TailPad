import { mainScene } from "#panels/game";

const panel = qs("#game-controller-panel .panel-content");

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