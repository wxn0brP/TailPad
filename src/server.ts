import { GlovesLinkServer } from "@wxn0brp/gloves-link-server";
import { FalconFrame } from "@wxn0brp/falcon-frame";
import * as Y from "yjs";
import { Valthera } from "@wxn0brp/db";

const app = new FalconFrame();
const port = +process.env.PORT || 26159;
const httpServer = app.listen(port);
app.static("public");
app.static("/dist", "dist");

console.log(`Listening on http://localhost:${port}`);

const db = new Valthera("data/master");
const serverDocs: Map<string, Y.Doc> = new Map();

function getServerDoc(id: string) {
    const exists = serverDocs.get(id);
    if (exists) return exists;
    const doc = new Y.Doc();
    serverDocs.set(id, doc);
    return doc;
}

async function loadFromDb() {
    const data = await db.find("data");
    if (!data.length) return;
    for (const doc of data) {
        const id = doc._id as string;
        delete doc._id;
        const map = getServerDoc(id).getMap("root");
        map.set("data", doc);
    }
}
loadFromDb();

const glovesLink = new GlovesLinkServer({
    server: httpServer,
    logs: true,
    authFn: async ({ headers, url, token }) => {
        return token === "TailPad";
    }
});

glovesLink.falconFrame(app);

glovesLink.onConnect((socket) => {
    console.log("New connection:", socket.id);
    let docId = "";

    socket.on("set-doc", (id) => {
        if (docId) glovesLink.room(docId)?.leave(socket);
        glovesLink.room(id).join(socket);
        docId = id;
    });

    socket.on("y-sync", (data) => {
        if (!docId) return console.error("y-sync", "docId is null");
        console.log("y-sync", socket.id);
        const clientUpdate = new Uint8Array(data);
        Y.applyUpdate(getServerDoc(docId), clientUpdate);

        const update = Y.encodeStateAsUpdate(getServerDoc(docId));
        socket.emit("y-sync", Array.from(update));
    });

    socket.on("y-update", (data) => {
        if (!docId) return console.error("y-update", "docId is null");
        console.log("y-update", socket.id);
        const update = new Uint8Array(data);
        Y.applyUpdate(getServerDoc(docId), update);

        glovesLink.room(docId).emitWithoutSelf(socket, "y-update", data);
    });

    socket.on("hard-save", async () => {
        if (!docId) return console.error("hard-save", "docId is null");
        console.log("hard-save", socket.id);
        const data = getServerDoc(docId).getMap("root").get("data");
        await db.updateOneOrAdd("data", { _id: docId }, data);
    });

    socket.on("scenes:list", async (callback) => {
        try {
            const scenes = await db.find("data");
            const sceneIds = scenes.map(s => s._id);
            callback({ err: false, data: sceneIds });
        } catch (e) {
            callback({ ert: true, msg: e.message });
        }
    });

    socket.on("scenes:create", async (id, callback) => {
        try {
            if (!id || typeof id !== "string" || id.length < 3) {
                return callback({ err: true, msg: "Invalid ID (min 3 chars)" });
            }
            const existing = await db.findOne("data", { _id: id });
            if (existing) {
                return callback({ err: true, msg: "Scene already exists" });
            }
            await db.add("data", { _id: id, sceneConfig: [] });
            callback({ err: false, data: id });
        } catch (e) {
            callback({ err: true, msg: e.message });
        }
    });

    socket.on("scenes:delete", async (id, callback) => {
        try {
            if (!id || typeof id !== "string") {
                return callback({ err: true, msg: "Invalid ID" });
            }
            if (id === "data") {
                return callback({ err: true, msg: "Cannot delete default scene" });
            }
            await db.removeOne("data", { _id: id });
            if (serverDocs.has(id)) {
                serverDocs.delete(id);
                console.log(`Removed scene ${id} from memory.`);
            }
            callback({ err: false });
        } catch (e) {
            callback({ err: true, message: e.message });
        }
    });
});