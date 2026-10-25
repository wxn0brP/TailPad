import { Action, ActionPath } from "../../../game/types";

export type RenderList = (
	listPath: ActionPath,
	actions: Action[],
) => HTMLElement;

export interface ActionRenderContext {
	path: ActionPath;
	renderList: RenderList;
}

export type ActionRenderer = (
	content: HTMLElement,
	action: Action,
	ctx: ActionRenderContext,
) => void;
