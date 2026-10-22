#!/usr/bin/env bun

import { FalconFrame } from "@wxn0brp/falcon-frame";
import { GlovesLinkServer } from "@wxn0brp/gloves-link-server";
import { createWriteStream, existsSync, mkdirSync, renameSync } from "fs";
import { dirname } from "path";
import { pipeline } from "stream/promises";
import * as Y from "yjs";
import {
	assetPath,
	assetsDir,
	configPath,
	createAssetDir,
	deleteAsset,
	deleteScene,
	isSceneId,
	listAssets,
	listScenes,
	projectDir,
	readConfig,
	readScene,
	renameAsset,
	writeConfig,
	writeScene,
} from "#server/project";

const TOKEN = process.env.TAILPAD_TOKEN;
if (!TOKEN) {
	console.error("TAILPAD_TOKEN is not set");
	process.exit(1);
}

if (!existsSync(configPath))
	console.warn(`No config.json5 found in ${projectDir}`);

const app = new FalconFrame();
const port = +process.env.PORT || 26159;

function getToken(req: any) {
	const header = req.header("authorization");
	if (typeof header === "string" && header.startsWith("Bearer "))
		return header.slice(7);
	return req.header("x-tailpad-token");
}

app.use("/api", (req, res, next) => {
	if (getToken(req) !== TOKEN)
		return res.status(401).json({
			err: true,
			msg: "Unauthorized",
		});
	next();
});

function sendError(res: any, error: any) {
	res.status(400).json({
		err: true,
		msg: error?.message ?? String(error),
	});
}

app.get("/api/scenes", (req, res) => {
	try {
		res.json({
			err: false,
			data: listScenes(),
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.get("/api/config", (req, res) => {
	try {
		res.json({
			err: false,
			data: readConfig(),
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.customParser(
	"/api/config",
	async (req, res) => {
		try {
			const chunks: Buffer[] = [];
			for await (const chunk of req) chunks.push(Buffer.from(chunk));
			writeConfig(Buffer.concat(chunks).toString("utf-8"));
			res.json({
				err: false,
			});
		} catch (error) {
			sendError(res, error);
		}
	},
	"put",
);

app.get("/api/assets", (req, res) => {
	try {
		res.json({
			err: false,
			data: listAssets(req.query.path ?? ""),
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.customParser(
	"/api/assets",
	async (req, res) => {
		try {
			const rel =
				new URL(req.url ?? "/", "http://localhost").searchParams.get("path") ??
				"";
			if (!rel) throw new Error("Missing path");
			const target = assetPath(rel);
			mkdirSync(dirname(target), {
				recursive: true,
			});
			const tmp = target + ".tmp";
			await pipeline(req, createWriteStream(tmp));
			renameSync(tmp, target);
			res.json({
				err: false,
			});
		} catch (error) {
			sendError(res, error);
		}
	},
	"put",
);

app.delete("/api/assets", (req, res) => {
	try {
		const rel = req.query.path ?? "";
		if (!rel) throw new Error("Missing path");
		deleteAsset(rel);
		res.json({
			err: false,
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.post("/api/assets/mkdir", (req, res) => {
	try {
		const rel = req.query.path ?? "";
		if (!rel) throw new Error("Missing path");
		createAssetDir(rel);
		res.json({
			err: false,
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.post("/api/assets/rename", (req, res) => {
	try {
		const from = req.query.from ?? "";
		const to = req.query.to ?? "";
		if (!from || !to) throw new Error("Missing path");
		renameAsset(from, to);
		res.json({
			err: false,
		});
	} catch (error) {
		sendError(res, error);
	}
});

app.static("/", import.meta.dirname + "/../public");
app.static("/dist", import.meta.dirname + "/../dist");
app.static("/assets", assetsDir, {
	errorIfDirNotFound: false,
});

const httpServer = app.listen(port);
console.log(`Project: ${projectDir}`);
console.log(`Listening on http://localhost:${port}`);

const serverDocs: Map<string, Y.Doc> = new Map();
const saveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
const dirty: Set<string> = new Set();

function getServerDoc(id: string) {
	const exists = serverDocs.get(id);
	if (exists) return exists;
	const doc = new Y.Doc();
	doc.getMap("root").set("data", {
		sceneConfig: readScene(id),
	});
	doc.on("update", () => scheduleSave(id));
	serverDocs.set(id, doc);
	return doc;
}

function scheduleSave(id: string) {
	dirty.add(id);
	const timer = saveTimers.get(id);
	if (timer) clearTimeout(timer);
	saveTimers.set(
		id,
		setTimeout(() => flushScene(id), 400),
	);
}

function flushScene(id: string) {
	const timer = saveTimers.get(id);
	if (timer) clearTimeout(timer);
	saveTimers.delete(id);
	dirty.delete(id);
	const doc = serverDocs.get(id);
	if (!doc) return;
	const data = doc.getMap("root").get("data") as any;
	writeScene(id, Array.isArray(data) ? data : (data?.sceneConfig ?? []));
}

function flushAll() {
	for (const id of [
		...dirty,
	])
		flushScene(id);
}

process.on("SIGINT", () => {
	flushAll();
	process.exit(0);
});
process.on("SIGTERM", () => {
	flushAll();
	process.exit(0);
});

const glovesLink = new GlovesLinkServer({
	logs: true,
});
glovesLink.falconFrame(app, false);
glovesLink.attachToHttpServer(httpServer);

glovesLink.of("/").auth(async ({ token }) => {
	return token === TOKEN
		? {
				status: 200,
				user: {},
			}
		: {
				status: 401,
				msg: "Unauthorized",
			};
});

glovesLink.of("/").onConnect(socket => {
	console.log("New connection:", socket.id);
	let docId = "";

	socket.on("set-doc", id => {
		if (!isSceneId(id)) return console.error("set-doc", "invalid id");
		if (docId) glovesLink.room(docId)?.leave(socket);
		glovesLink.room(id).join(socket);
		docId = id;
	});

	socket.on("y-sync", data => {
		if (!docId) return console.error("y-sync", "docId is null");
		console.log("y-sync", socket.id);
		try {
			const clientUpdate = new Uint8Array(data);
			Y.applyUpdate(getServerDoc(docId), clientUpdate);

			const update = Y.encodeStateAsUpdate(getServerDoc(docId));
			socket.emit("y-sync", Array.from(update));
		} catch (e) {
			console.error("y-sync", e);
		}
	});

	socket.on("y-update", data => {
		if (!docId) return console.error("y-update", "docId is null");
		console.log("y-update", socket.id);
		try {
			const update = new Uint8Array(data);
			Y.applyUpdate(getServerDoc(docId), update);

			glovesLink.room(docId).emitWithoutSelf(socket, "y-update", data);
		} catch (e) {
			console.error("y-update", e);
		}
	});

	socket.on("hard-save", () => {
		if (!docId) return console.error("hard-save", "docId is null");
		console.log("hard-save", socket.id);
		try {
			flushScene(docId);
		} catch (e) {
			console.error("hard-save", e);
		}
	});

	socket.on("scenes:list", callback => {
		try {
			callback({
				err: false,
				data: listScenes(),
			});
		} catch (e) {
			callback({
				err: true,
				msg: e.message,
			});
		}
	});

	socket.on("scenes:create", (id, callback) => {
		try {
			if (!id || typeof id !== "string" || id.length < 3)
				return callback({
					err: true,
					msg: "Invalid ID (min 3 chars)",
				});
			if (!isSceneId(id))
				return callback({
					err: true,
					msg: "Invalid ID",
				});
			if (listScenes().includes(id))
				return callback({
					err: true,
					msg: "Scene already exists",
				});

			serverDocs.delete(id);
			writeScene(id, []);
			glovesLink.of("/").emit("scenes:changed");
			callback({
				err: false,
				data: id,
			});
		} catch (e) {
			callback({
				err: true,
				msg: e.message,
			});
		}
	});

	socket.on("scenes:delete", (id, callback) => {
		try {
			if (!id || typeof id !== "string" || !isSceneId(id))
				return callback({
					err: true,
					msg: "Invalid ID",
				});

			const timer = saveTimers.get(id);
			if (timer) clearTimeout(timer);
			saveTimers.delete(id);
			dirty.delete(id);
			serverDocs.delete(id);
			deleteScene(id);
			glovesLink.of("/").emit("scenes:changed");
			callback({
				err: false,
			});
		} catch (e) {
			callback({
				err: true,
				msg: e.message,
			});
		}
	});

	socket.on("disconnect", () => {
		if (!docId) return;
		try {
			flushScene(docId);
		} catch (e) {
			console.error("disconnect", e);
		}
	});
});
