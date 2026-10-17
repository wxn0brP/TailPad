import { Action } from "../../../game/types";

export type ActionRenderer = (
	content: HTMLElement,
	action: Action,
	index: number,
) => void;
