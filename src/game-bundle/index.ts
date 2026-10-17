import "@wxn0brp/flanker-ui/html";

import { actionEmitter } from "#game/sceneController";
import { GameScene } from "#game/state";
import "#game/style.scss";
import { ActionBackgroundType } from "#game/types";
import { MenuUI } from "./menu-ui";
import { getSaves, SaveData, saveGameToSlot } from "./save";
import { SaveLoadUI } from "./save-ui";
import "./ui.scss";

let sceneName: string;
const scene = new GameScene(qs("#game-scene"));
const saveLoadUI = new SaveLoadUI();
const menuUI = new MenuUI();

async function loadScene(name: string) {
	sceneName = name;
	const res = await fetch(`./assets/scenes/${name}.json`).then(res =>
		res.json(),
	);
	scene.sceneConfig = res;
	scene.visitedScenes.add(name);
	scene.dialogEngine.element.innerHTML = "";
	scene.choicesContainer.innerHTML = "";
}

function restoreSceneState(index: number) {
	for (let i = index; i >= 0; i--) {
		const action = scene.sceneConfig[i];
		if (action && action.type === "background") {
			scene.setBackground((action as ActionBackgroundType).url);
			break;
		}
	}
}

async function startGame(savedGame?: SaveData) {
	if (savedGame) {
		await loadScene(savedGame.sceneName);
		restoreSceneState(savedGame.lastIndex);
		scene.lastIndex.set(savedGame.lastIndex);
		scene.variableManager.setAll(savedGame.variables ?? {});
	} else {
		const urlParams = new URLSearchParams(window.location.search);
		await loadScene(urlParams.get("scene") || "master");
		scene.lastIndex.set(-1);
		scene.variableManager.clear();
	}

	scene.pause.set(false);
	scene.nextStep();
}

async function handleSave() {
	scene.pause.set(true);
	const slot = await saveLoadUI.show("save");
	if (slot !== null) {
		saveGameToSlot(slot, {
			sceneName,
			lastIndex: scene.lastIndex.get(),
			variables: scene.variableManager.getAll(),
		});
	}
	scene.pause.set(false);
}

async function handleLoad() {
	scene.pause.set(true);
	const slot = await saveLoadUI.show("load");
	if (slot !== null) {
		const saves = getSaves();
		const savedGame = saves[slot];
		if (savedGame) {
			await startGame(savedGame);
		} else {
			scene.pause.set(false);
		}
	} else {
		scene.pause.set(false);
	}
}

actionEmitter.on("go-to-scene", async (cb, action: any) => {
	await loadScene(action.scene);
	scene.lastIndex.set(-1);
	scene.nextStep();
	cb();
});

const autoButton = qs<HTMLButtonElement>("#hud-auto");
const skipButton = qs<HTMLButtonElement>("#hud-skip");
const historyOverlay = qs<HTMLDivElement>("#history-overlay");
const historyList = qs<HTMLDivElement>("#history-list");

autoButton.addEventListener("click", () => {
	scene.autoMode.set(!scene.autoMode.get());
});
scene.autoMode.subscribe(value => autoButton.classList.toggle("active", value));

skipButton.addEventListener("click", () => {
	scene.skipMode.set(!scene.skipMode.get());
});
scene.skipMode.subscribe(value => skipButton.classList.toggle("active", value));

function renderHistory() {
	historyList.innerHTML = "";
	const history = scene.dialogEngine.history;
	if (!history.length) {
		historyList.innerHTML = `<div class="history-empty">No history</div>`;
		return;
	}
	for (const line of history) {
		const item = document.createElement("div");
		item.className = "history-line";
		item.textContent = line;
		historyList.appendChild(item);
	}
}

qs("#hud-history").addEventListener("click", () => {
	renderHistory();
	scene.pause.set(true);
	historyOverlay.classList.remove("hidden");
	historyList.scrollTop = historyList.scrollHeight;
});

qs("#history-close").addEventListener("click", () => {
	historyOverlay.classList.add("hidden");
	scene.pause.set(false);
});

window.addEventListener("keydown", async e => {
	if (!historyOverlay.classList.contains("hidden")) {
		if (e.key === "Escape") historyOverlay.classList.add("hidden");
		return;
	}

	if (e.key === "Escape" || e.key === "Backspace") {
		scene.pause.set(true);
		const action = await menuUI.show();
		switch (action) {
			case "save":
				await handleSave();
				break;
			case "load":
				await handleLoad();
				break;
			case "resume":
				scene.pause.set(false);
				break;
		}
	}
});

async function main() {
	const slot = await saveLoadUI.show("load");
	if (slot !== null) {
		const saves = getSaves();
		const savedGame = saves[slot];
		if (savedGame) {
			await startGame(savedGame);
		} else {
			await startGame();
		}
	} else {
		await startGame(); // New Game
	}
}

main();
