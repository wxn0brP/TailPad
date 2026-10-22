import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	statSync,
	writeFileSync,
} from "fs";
import JSON5 from "json5";
import { dirname, join, normalize, resolve, sep } from "path";

const dirArg = process.argv.slice(2).find(arg => !arg.startsWith("-"));

export const projectDir = resolve(dirArg ?? process.cwd());
export const assetsDir = join(projectDir, "assets");
export const scenesDir = join(assetsDir, "scenes");
export const configPath = join(projectDir, "config.json5");

export interface AssetEntry {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	mtime?: number;
}

export function ensureDirs() {
	mkdirSync(scenesDir, {
		recursive: true,
	});
}

export function isSceneId(id: string) {
	return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id);
}

export function assetPath(rel: string) {
	const full = resolve(assetsDir, normalize(rel || ""));
	if (full !== assetsDir && !full.startsWith(assetsDir + sep))
		throw new Error("Invalid path");
	return full;
}

export function toPosix(path: string) {
	return path.split(sep).join("/");
}

export function listScenes() {
	if (!existsSync(scenesDir)) return [];
	return readdirSync(scenesDir)
		.filter(file => file.length > 5 && file.endsWith(".json"))
		.map(file => file.slice(0, -5))
		.filter(id => isSceneId(id))
		.sort();
}

export function readScene(id: string) {
	if (!isSceneId(id)) throw new Error("Invalid scene id");
	const file = join(scenesDir, id + ".json");
	if (!existsSync(file)) return [];
	const parsed = JSON.parse(readFileSync(file, "utf-8"));
	if (!Array.isArray(parsed)) throw new Error("Scene must be an array");
	return parsed;
}

export function writeScene(id: string, sceneConfig: any[]) {
	if (!isSceneId(id)) throw new Error("Invalid scene id");
	ensureDirs();
	const file = join(scenesDir, id + ".json");
	const tmp = file + ".tmp";
	writeFileSync(tmp, JSON.stringify(sceneConfig, null, "\t") + "\n");
	renameSync(tmp, file);
}

export function deleteScene(id: string) {
	if (!isSceneId(id)) throw new Error("Invalid scene id");
	const file = join(scenesDir, id + ".json");
	if (existsSync(file)) rmSync(file);
}

export function readConfig() {
	const raw = readFileSync(configPath, "utf-8");
	return {
		raw,
		parsed: JSON5.parse(raw),
	};
}

export function writeConfig(raw: string) {
	const parsed = JSON5.parse(raw);
	const tmp = configPath + ".tmp";
	writeFileSync(tmp, raw);
	renameSync(tmp, configPath);
	return parsed;
}

export function listAssets(rel = "") {
	const dir = assetPath(rel);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, {
		withFileTypes: true,
	}).map(entry => {
		const path = toPosix(join(rel, entry.name));
		const full = join(dir, entry.name);
		const item: AssetEntry = {
			name: entry.name,
			path,
			type: entry.isDirectory() ? "dir" : "file",
		};
		try {
			const stats = statSync(full);
			item.size = stats.size;
			item.mtime = stats.mtimeMs;
		} catch {}
		return item;
	});
}

export function createAssetDir(rel: string) {
	mkdirSync(assetPath(rel), {
		recursive: true,
	});
}

export function deleteAsset(rel: string) {
	const path = assetPath(rel);
	if (existsSync(path))
		rmSync(path, {
			recursive: true,
			force: true,
		});
}

export function renameAsset(from: string, to: string) {
	const target = assetPath(to);
	mkdirSync(dirname(target), {
		recursive: true,
	});
	renameSync(assetPath(from), target);
}
