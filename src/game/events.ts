import type { ActionPath } from "./types";

export type GameEvents = {
	"run-scene": (cursor: number | ActionPath) => void;
	"scenes-end": () => void;
	pause: (cursor: ActionPath) => void;
};
