import { renderCharacter } from "./character";
import { renderCondition } from "./condition";
import { renderDialogChoice } from "./dialog-choice";
import { renderFallback } from "./fallback";
import { renderRandomBranch } from "./random-branch";
import { renderSimple } from "./simple";
import type { ActionRenderer } from "./types";
import { renderVariable } from "./variable";

export const actionRenderers: Record<string, ActionRenderer> = {
	text: renderSimple,
	background: renderSimple,
	delay: renderSimple,
	"go-to-scene": renderSimple,
	"play-music": renderSimple,
	"stop-music": renderSimple,
	"play-sound": renderSimple,
	"set-volume": renderSimple,
	"set-variable": renderVariable,
	effect: renderSimple,
	"show-character": renderCharacter,
	"hide-character": renderCharacter,
	"move-character": renderCharacter,
	"dialog-choice": renderDialogChoice,
	condition: renderCondition,
	"random-branch": renderRandomBranch,
};

export { renderFallback };
