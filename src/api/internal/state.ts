import GlovesLinkClient from "@wxn0brp/gloves-link-client";
import * as Y from "yjs";
import { mgl } from "./mlg";

interface BaseData<T = undefined> {
	err: boolean;
	msg?: string;
	data: T;
}

type IncomeTypes = {};

type OutcomeTypes = {
	"set-doc": (id: string) => void;
	"y-sync": (data: number[]) => void;
	"y-update": (data: number[]) => void;
	"hard-save": () => void;
	"scenes:list": (callback: (res: BaseData<string[]>) => void) => void;
	"scenes:create": (
		id: string,
		callback: (res: BaseData<string>) => void,
	) => void;
	"scenes:delete": (id: string, callback: (res: BaseData) => void) => void;
};

const PASS_STORAGE_KEY = "tailpad-pass";

function getPass() {
	const raw = window.location.hash.slice(1);
	if (raw) {
		const pass = new URLSearchParams(raw).get("pass");
		if (pass) {
			sessionStorage.setItem(PASS_STORAGE_KEY, pass);
			return pass;
		}
	}

	const stored = sessionStorage.getItem(PASS_STORAGE_KEY);
	if (stored) return stored;

	const entered = prompt("Enter password") ?? "";
	if (entered) sessionStorage.setItem(PASS_STORAGE_KEY, entered);
	return entered;
}

export const client = new GlovesLinkClient<IncomeTypes, OutcomeTypes>("/", {
	reConnect: true,
	logs: true,
	token: getPass(),
});

client.on("connect_forbidden", console.error);
client.on("connect_serverError", console.error);
client.on("connect_unauthorized", console.error);

export const ydoc: Y.Doc = new Y.Doc();
export const root: Y.Map<any> = ydoc.getMap("root");

mgl.state = {
	client,
	ydoc,
	root,
};
