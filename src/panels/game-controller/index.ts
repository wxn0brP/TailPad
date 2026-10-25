import { mainScene } from "#panels/game";
import { createPanel } from "#panels/createPanel";
import { watchCheckbox } from "@wxn0brp/flanker-ui/component/helpers";
import { ActionPath } from "#game/types";

const panel = createPanel(
	"Game controller",
	`<div>
        <button class="btn" data-id="next-step">Next step</button>
        <button class="btn" data-id="reset-step">Reset</button>
        <br>
        <br>
        <label>
            Cursor:
            <input data-id="scene-index" type="text" value="0">
        </label>
        <br>
        <label>
            Pause:
            <input data-id="pause" type="checkbox" checked>
        </label>
    </div>`,
	"game-controller-panel",
);

panel.qs("next-step", 1).addEventListener("click", () => {
	mainScene.nextStep();
});

panel.qs("reset-step", 1).addEventListener("click", () => {
	mainScene.background.src = "";
	mainScene.dialogEngine.element.innerHTML = "";
	mainScene.variableManager.clear();
	mainScene.beginSession(true);
	mainScene.stepOnce = true;
	mainScene.eventEmitter.emit(
		"run-scene",
		[
			0,
		],
	);
});

const sceneIndexInput = panel.qi("scene-index", 1);

function parseCursor(raw: string): ActionPath {
	return raw
		.split(".")
		.map(part => part.trim())
		.filter(Boolean)
		.map(part => (/^\d+$/.test(part) ? Number(part) : part));
}

sceneIndexInput.addEventListener("change", () => {
	const cursor = parseCursor(sceneIndexInput.value);
	if (!cursor.length) return;
	mainScene.runSceneAt(cursor);
});

mainScene.cursor.subscribe(cursor => {
	sceneIndexInput.value = cursor.join(".");
});

watchCheckbox(panel.qi("pause", 1), mainScene.pause);
mainScene.pause.set(true);
mainScene.cursor.set([
	0,
]);
