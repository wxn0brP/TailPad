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
const serverDoc = new Y.Doc();

async function loadFromDb() {
    const data = await db.findOne("data", { _id: "data" });
    if (!data) return;
    delete data._id;
    const map = serverDoc.getMap("root");
    map.set("data", data);
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

    socket.on("y-sync", (data) => {
        console.log("y-sync", socket.id);
        const clientUpdate = new Uint8Array(data);
        Y.applyUpdate(serverDoc, clientUpdate);

        const update = Y.encodeStateAsUpdate(serverDoc);
        socket.emit("y-sync", Array.from(update));
    });

    socket.on("y-update", (data) => {
        console.log("y-update", socket.id);
        const update = new Uint8Array(data);
        Y.applyUpdate(serverDoc, update);

        glovesLink.broadcastWithoutSelf(socket, "y-update", data);
    });

    socket.on("hard-save", async () => {
        console.log("hard-save", socket.id);
        const data = serverDoc.getMap("root").get("data");
        await db.updateOneOrAdd("data", { _id: "data" }, data);
    })
});