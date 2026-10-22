import { api } from "#api/internal/http";
import { createPanel } from "#panels/createPanel";
import { uiMsg } from "@wxn0brp/flanker-dialog/msg/index";
import "./style.scss";

interface AssetEntry {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	mtime?: number;
}

const panel = createPanel(
	"Project",
	`
    <div class="project-panel-content">
        <div class="project-tabs">
            <button class="btn project-tab-button active" data-tab="assets">Assets</button>
            <button class="btn project-tab-button" data-tab="config">Config</button>
        </div>
        <div class="project-tab" data-tab-content="assets">
            <div class="asset-toolbar">
                <button class="btn" id="assets-up">Up</button>
                <span id="assets-path">/</span>
                <button class="btn" id="assets-refresh">Refresh</button>
                <button class="btn" id="assets-upload">Upload</button>
                <button class="btn" id="assets-mkdir">New folder</button>
                <input type="file" id="assets-file" multiple hidden>
            </div>
            <div class="asset-list" id="assets-list"></div>
            <div class="asset-preview" id="assets-preview"></div>
        </div>
        <div class="project-tab hidden" data-tab-content="config">
            <textarea id="config-editor" spellcheck="false"></textarea>
            <div class="config-actions">
                <button class="btn" id="config-save">Save</button>
                <span id="config-status"></span>
            </div>
        </div>
    </div>
    `,
	"project-panel",
);

const assetList = panel.qs<HTMLDivElement>("#assets-list");
const assetPathLabel = panel.qs<HTMLSpanElement>("#assets-path");
const assetPreview = panel.qs<HTMLDivElement>("#assets-preview");
const fileInput = panel.qs<HTMLInputElement>("#assets-file");
const configEditor = panel.qs<HTMLTextAreaElement>("#config-editor");
const configStatus = panel.qs<HTMLSpanElement>("#config-status");

let currentDir = "";

function joinPath(...parts: string[]) {
	return parts.filter(Boolean).join("/").replace(/\/+/g, "/");
}

function parentDir(path: string) {
	return path.split("/").slice(0, -1).join("/");
}

function formatSize(size?: number) {
	if (size === undefined) return "";
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} kB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(name: string) {
	return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name);
}

function showPreview(entry: AssetEntry) {
	assetPreview.innerHTML = "";
	if (isImage(entry.name)) {
		const img = document.createElement("img");
		img.src = `/assets/${entry.path}`;
		img.alt = entry.name;
		assetPreview.appendChild(img);
		return;
	}
	const text = document.createElement("span");
	text.textContent = `${entry.path} (${formatSize(entry.size)})`;
	assetPreview.appendChild(text);
}

async function renameEntry(entry: AssetEntry) {
	const nextName = prompt("New name", entry.name)?.trim();
	if (!nextName || nextName === entry.name) return;
	try {
		await api(
			`/api/assets/rename?from=${encodeURIComponent(entry.path)}&to=${encodeURIComponent(joinPath(currentDir, nextName))}`,
			{
				method: "POST",
			},
		);
		await refreshAssets();
	} catch (e) {
		uiMsg("Error renaming: " + e.message);
	}
}

async function deleteEntry(entry: AssetEntry) {
	if (!confirm(`Delete "${entry.path}"?`)) return;
	try {
		await api(`/api/assets?path=${encodeURIComponent(entry.path)}`, {
			method: "DELETE",
		});
		await refreshAssets();
	} catch (e) {
		uiMsg("Error deleting: " + e.message);
	}
}

function renderAssets(entries: AssetEntry[]) {
	assetList.innerHTML = "";
	assetPathLabel.textContent = "/" + currentDir;
	assetPreview.innerHTML = "";

	if (!entries.length) {
		const empty = document.createElement("div");
		empty.className = "asset-empty";
		empty.textContent = "Empty directory";
		assetList.appendChild(empty);
		return;
	}

	entries.sort((a, b) => {
		if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});

	for (const entry of entries) {
		const row = document.createElement("div");
		row.className = "asset-row";

		const name = document.createElement("button");
		name.className = "asset-name";
		name.textContent = (entry.type === "dir" ? "[dir] " : "") + entry.name;
		name.addEventListener("click", () => {
			if (entry.type === "dir") {
				currentDir = entry.path;
				refreshAssets();
			} else {
				showPreview(entry);
			}
		});
		row.appendChild(name);

		const actions = document.createElement("div");
		actions.className = "asset-actions";

		const rename = document.createElement("button");
		rename.className = "btn";
		rename.textContent = "Rename";
		rename.addEventListener("click", () => renameEntry(entry));
		actions.appendChild(rename);

		const remove = document.createElement("button");
		remove.className = "btn";
		remove.textContent = "Delete";
		remove.addEventListener("click", () => deleteEntry(entry));
		actions.appendChild(remove);

		row.appendChild(actions);
		assetList.appendChild(row);
	}
}

async function refreshAssets() {
	try {
		const entries = await api<AssetEntry[]>(
			`/api/assets?path=${encodeURIComponent(currentDir)}`,
		);
		renderAssets(entries);
	} catch (e) {
		uiMsg("Error loading assets: " + e.message);
	}
}

panel.qs("#assets-up").addEventListener("click", () => {
	currentDir = parentDir(currentDir);
	refreshAssets();
});

panel.qs("#assets-refresh").addEventListener("click", refreshAssets);

panel.qs("#assets-upload").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
	const files = Array.from(fileInput.files ?? []);
	for (const file of files) {
		try {
			await api(
				`/api/assets?path=${encodeURIComponent(joinPath(currentDir, file.name))}`,
				{
					method: "PUT",
					body: file,
				},
			);
		} catch (e) {
			uiMsg(`Error uploading ${file.name}: ` + e.message);
		}
	}
	fileInput.value = "";
	await refreshAssets();
});

panel.qs("#assets-mkdir").addEventListener("click", async () => {
	const name = prompt("Folder name")?.trim();
	if (!name) return;
	try {
		await api(
			`/api/assets/mkdir?path=${encodeURIComponent(joinPath(currentDir, name))}`,
			{
				method: "POST",
			},
		);
		await refreshAssets();
	} catch (e) {
		uiMsg("Error creating folder: " + e.message);
	}
});

async function loadConfig() {
	try {
		const data = await api<{
			raw: string;
		}>("/api/config");
		configEditor.value = data.raw;
		configStatus.textContent = "";
	} catch (e) {
		configStatus.textContent = "Error: " + e.message;
	}
}

panel.qs("#config-save").addEventListener("click", async () => {
	configStatus.textContent = "Saving...";
	try {
		await api("/api/config", {
			method: "PUT",
			body: configEditor.value,
		});
		configStatus.textContent = "Saved";
	} catch (e) {
		configStatus.textContent = "Error: " + e.message;
	}
});

panel
	.querySelectorAll<HTMLButtonElement>(".project-tab-button")
	.forEach(button => {
		button.addEventListener("click", () => {
			const tab = button.dataset.tab;
			panel
				.querySelectorAll<HTMLButtonElement>(".project-tab-button")
				.forEach(item => item.classList.toggle("active", item === button));
			panel
				.querySelectorAll<HTMLDivElement>(".project-tab")
				.forEach(item =>
					item.classList.toggle("hidden", item.dataset.tabContent !== tab),
				);
			if (tab === "config") loadConfig();
		});
	});

refreshAssets();
