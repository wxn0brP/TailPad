import "@wxn0brp/flanker-ui/html";

import type { MusicState } from "#game/audio";
import { renderRichText } from "#game/richText";
import { actionEmitter } from "#game/sceneController";
import type { SpriteState } from "#game/sprite";
import { GameScene } from "#game/state";
import "#game/style.scss";
import { ActionBackgroundType, ActionPlayMusicType } from "#game/types";
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
	scene.cursor.set([
		0,
	]);
	scene.dialogEngine.element.innerHTML = "";
	scene.choicesContainer.innerHTML = "";
}

function legacyIndex(savedGame: SaveData) {
	return savedGame.lastIndex ?? 0;
}

function restoreSceneState(savedGame: SaveData) {
	if (savedGame.background !== undefined) {
		if (savedGame.background) scene.setBackground(savedGame.background);
		return;
	}

	const index = legacyIndex(savedGame);
	for (let i = index; i >= 0; i--) {
		const action = scene.sceneConfig[i];
		if (action && action.type === "background") {
			scene.setBackground((action as ActionBackgroundType).url);
			break;
		}
	}
}

function restoreMusicState(index: number): MusicState | null {
	for (let i = index; i >= 0; i--) {
		const action = scene.sceneConfig[i];
		if (!action) continue;
		if (action.type === "stop-music") return null;
		if (action.type === "play-music") {
			const music = action as ActionPlayMusicType;
			return {
				url: music.url,
				loop: music.loop ?? true,
				currentTime: 0,
			};
		}
	}
	return null;
}

function restoreCharacters(savedGame: SaveData) {
	if (savedGame.characters) {
		scene.spriteEngine.restoreState(savedGame.characters);
		return;
	}

	const characters = new Map<string, SpriteState>();
	const index = legacyIndex(savedGame);
	for (let i = 0; i <= index; i++) {
		const action = scene.sceneConfig[i];
		if (!action) continue;

		if (action.type === "show-character") {
			characters.set(action.id, {
				id: action.id,
				url: action.url,
				position: action.position,
			});
		} else if (action.type === "hide-character") {
			characters.delete(action.id);
		} else if (action.type === "move-character") {
			const sprite = characters.get(action.id);
			if (sprite) sprite.position = action.position;
		}
	}

	scene.spriteEngine.restoreState([
		...characters.values(),
	]);
}

async function startGame(savedGame?: SaveData) {
	scene.beginSession(true);

	if (savedGame) {
		await loadScene(savedGame.sceneName);
		restoreSceneState(savedGame);
		restoreCharacters(savedGame);
		scene.variableManager.setAll(savedGame.variables ?? {});
		if (savedGame.visitedScenes)
			scene.visitedScenes = new Set(savedGame.visitedScenes);
		scene.visitedScenes.add(savedGame.sceneName);
		await scene.audioEngine.restoreMusic(
			savedGame.music !== undefined
				? savedGame.music
				: restoreMusicState(legacyIndex(savedGame)),
		);
	} else {
		const urlParams = new URLSearchParams(window.location.search);
		await loadScene(urlParams.get("scene") || "master");
		scene.cursor.set([
			0,
		]);
		scene.variableManager.clear();
		await scene.audioEngine.stopMusic();
	}

	scene.pause.set(false);
	if (savedGame)
		scene.runSceneAt(
			savedGame.cursor ?? [
				legacyIndex(savedGame),
			],
		);
	else
		scene.runSceneAt([
			0,
		]);
}

async function handleSave() {
	scene.pause.set(true);
	const slot = await saveLoadUI.show("save");
	if (slot !== null) {
		saveGameToSlot(slot, {
			sceneName,
			cursor: scene.cursor.get(),
			background: scene.background.getAttribute("src") ?? scene.background.src,
			variables: scene.variableManager.getAll(),
			music: scene.audioEngine.getMusicState(),
			characters: scene.spriteEngine.getState(),
			visitedScenes: [
				...scene.visitedScenes,
			],
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
	try {
		scene.interrupt();
		await loadScene(action.scene);
		scene.cursor.set([
			0,
		]);
		scene.runSceneAt([
			0,
		]);
	} catch (error) {
		console.error(error);
	} finally {
		cb();
	}
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
		item.appendChild(renderRichText(line));
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

let uiBusy = false;

async function openMenu() {
	if (uiBusy || !historyOverlay.classList.contains("hidden")) return;
	uiBusy = true;
	scene.pause.set(true);

	try {
		const action = await menuUI.show();
		switch (action) {
			case "save":
				await handleSave();
				break;
			case "load":
				await handleLoad();
				break;
			default:
				scene.pause.set(false);
		}
	} finally {
		uiBusy = false;
	}
}

qs("#hud-menu").addEventListener("click", () => void openMenu());

window.addEventListener("keydown", async e => {
	if (!historyOverlay.classList.contains("hidden")) {
		if (e.key === "Escape") {
			historyOverlay.classList.add("hidden");
			scene.pause.set(false);
		}
		return;
	}

	if (e.key === "Escape" || e.key === "Backspace") await openMenu();
});

async function main() {
	uiBusy = true;
	try {
		const slot = await saveLoadUI.show("load", true);
		if (slot !== null) {
			const savedGame = getSaves()[slot];
			if (savedGame) {
				await startGame(savedGame);
				return;
			}
		}
		await startGame();
	} finally {
		uiBusy = false;
	}
}

main();
