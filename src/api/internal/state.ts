import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import * as Y from "yjs";
import { mgl } from "./mlg";

interface BaseData<T = undefined> {
    err: boolean;
    msg?: string;
    data: T;
}

type IncomeTypes = {

}

type OutcomeTypes = {
    "set-doc": (id: string) => void;
    "y-sync": (data: number[]) => void;
    "y-update": (data: number[]) => void;
    "hard-save": () => void;
    "scenes:list": (callback: (res: BaseData<string[]>) => void) => void;
    "scenes:create": (id: string, callback: (res: BaseData<string>) => void) => void;
    "scenes:delete": (id: string, callback: (res: BaseData) => void) => void;
}

export const client = new GlovesLinkClient<IncomeTypes, OutcomeTypes>("/", {
    reConnect: true,
    logs: true,
    token: "TailPad",
});

client.on("connect_forbidden", console.error);
client.on("connect_serverError", console.error);
client.on("connect_unauthorized", console.error);

export const ydoc: Y.Doc = new Y.Doc();
export const root: Y.Map<any> = ydoc.getMap("root");

mgl.state = {
    client,
    ydoc,
    root
}