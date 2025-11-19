import { client, root, ydoc } from "./state";
import * as Y from "yjs";
import { render } from "./utils";

ydoc.on("update", (update: Uint8Array) => {
    client.emit("y-update", Array.from(update));
});

client.on("y-update", (data: number[]) => {
    Y.applyUpdate(ydoc, new Uint8Array(data));
});

client.on("connect", () => {
    const update: Uint8Array = Y.encodeStateAsUpdate(ydoc);
    client.emit("y-sync", Array.from(update));
});

client.on("y-sync", (data: number[]) => {
    const update: Uint8Array = new Uint8Array(data);
    Y.applyUpdate(ydoc, update);

    const reply: Uint8Array = Y.encodeStateAsUpdate(ydoc);
    client.emit("y-update", Array.from(reply));
});

root.observeDeep(render);
