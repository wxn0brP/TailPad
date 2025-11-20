import { client } from "#api/internal/state";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog";
import "./style.scss";

const panel = createPanel(
    "Scene Manager",
    `
    <div class="scene-manager-content">
        <ul id="scene-list"></ul>
        <div class="scene-manager-controls">
            <input type="text" id="new-scene-name" placeholder="New scene name..." />
            <button id="create-scene-btn" class="btn">Create</button>
        </div>
    </div>
    `,
    {
        height: 300,
        width: 300,
        left: 1120,
        top: 550,
        minHeight: 200,
        minWidth: 200
    }
);

const sceneList = panel.querySelector<HTMLUListElement>("#scene-list");
const newSceneNameInput = panel.querySelector<HTMLInputElement>("#new-scene-name");
const createSceneBtn = panel.querySelector<HTMLButtonElement>("#create-scene-btn");

export function getSceneId() {
    return new URL(window.location.href).searchParams.get("scene") || "master";
}

function refreshScenes() {
    client.emit("scenes:list", (res) => {
        if (res.err) {
            uiMsg("Error loading scenes: " + res.msg);
            return;
        }
        sceneList.innerHTML = "";
        const scenes: string[] = res.data;
        const currentScene = getSceneId();

        scenes.forEach(sceneId => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${sceneId} ${sceneId === currentScene ? '(current)' : ''}</span>
                <div class="scene-item-controls">
                    <button class="btn go-btn" data-scene-id="${sceneId}">Go</button>
                    <button class="btn delete-btn" data-scene-id="${sceneId}" ${sceneId === 'data' ? 'disabled' : ''}>Delete</button>
                </div>
            `;
            sceneList.appendChild(li);
        });
    });
}

sceneList.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("go-btn")) {
        const sceneId = target.dataset.sceneId;
        if (sceneId === getSceneId()) return;
        window.location.search = `?scene=${sceneId}`;
    }

    if (target.classList.contains("delete-btn")) {
        const sceneId = target.dataset.sceneId;
        if (confirm(`Are you sure you want to delete scene "${sceneId}"?`)) {
            client.emit("scenes:delete", sceneId, (res) => {
                if (!res.err) {
                    uiMsg(`Scene "${sceneId}" deleted.`);
                    refreshScenes();
                } else {
                    uiMsg("Error deleting scene: " + res.msg);
                }
            });
        }
    }
});

createSceneBtn.addEventListener("click", () => {
    const newSceneName = newSceneNameInput.value.trim();
    if (newSceneName) {
        client.emit("scenes:create", newSceneName, (res) => {
            if (!res.err) {
                uiMsg(`Scene "${newSceneName}" created.`);
                newSceneNameInput.value = "";
                refreshScenes();
            } else {
                uiMsg("Error creating scene: " + res.msg);
            }
        });
    }
});

client.on("connect", () => {
    refreshScenes();
});
