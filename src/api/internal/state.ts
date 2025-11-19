import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import * as Y from "yjs";
import { mgl } from "./mlg";

export const client = new GlovesLinkClient("", {
    reConnect: true,
    logs: true,
    token: "TailPad",
});

export const ydoc: Y.Doc = new Y.Doc();
export const root: Y.Map<any> = ydoc.getMap("root");

mgl.state = {
    client,
    ydoc,
    root
}