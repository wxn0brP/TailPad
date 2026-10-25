export type ActionPath = (string | number)[];

export interface ActionBase {
	name?: string;
	noWaitForEnd?: true;
	type: string;
}

export interface ActionTextType extends ActionBase {
	type: "text";
	text: string;
}

export interface ActionBackgroundType extends ActionBase {
	type: "background";
	url: string;
}

export interface ActionDelayType extends ActionBase {
	type: "delay";
	ms: number;
}

export interface ActionGoToSceneType extends ActionBase {
	type: "go-to-scene";
	scene: string;
}

export interface InlineCase {
	actions?: Action[];
	scene?: string;
}

export interface Choice extends InlineCase {
	text: string;
}

export interface ActionDialogChoiceType extends ActionBase {
	type: "dialog-choice";
	text: string;
	choices: Choice[];
}

export interface ActionPlayMusicType extends ActionBase {
	type: "play-music";
	url: string;
	loop?: boolean;
	fadeIn?: number;
	force?: boolean;
}

export interface ActionStopMusicType extends ActionBase {
	type: "stop-music";
	fadeOut?: number;
}

export interface ActionPlaySoundType extends ActionBase {
	type: "play-sound";
	url: string;
	volume?: number;
}

export interface ActionSetVolumeType extends ActionBase {
	type: "set-volume";
	channel: "music" | "sound";
	volume: number;
}

export interface ActionShowCharacterType extends ActionBase {
	type: "show-character";
	id: string;
	url: string;
	position: "left" | "center" | "right";
	transition?: "fade" | "slide" | "none";
	transitionDuration?: number;
}

export interface ActionHideCharacterType extends ActionBase {
	type: "hide-character";
	id: string;
	transition?: "fade" | "slide" | "none";
	transitionDuration?: number;
}

export interface ActionMoveCharacterType extends ActionBase {
	type: "move-character";
	id: string;
	position: "left" | "center" | "right";
	duration?: number;
}

export interface ActionSetVariableType extends ActionBase {
	type: "set-variable";
	name: string;
	value: string | number | boolean;
	operation?: "set" | "add" | "subtract" | "multiply" | "divide";
}

export interface ConditionBranch extends InlineCase {
	condition: string;
	operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
	value: string | number | boolean;
}

export interface ActionConditionType extends ActionBase {
	type: "condition";
	branches?: ConditionBranch[];
	defaultScene?: string;
	expression?: string;
	scene?: string;
	actions?: Action[];
	elseActions?: Action[];
	defaultActions?: Action[];
}

export interface RandomBranch extends InlineCase {
	weight?: number;
}

export interface ActionRandomBranchType extends ActionBase {
	type: "random-branch";
	branches: RandomBranch[];
	defaultScene?: string;
	defaultActions?: Action[];
}

export interface ActionEffectType extends ActionBase {
	type: "effect";
	effect: "shake" | "flash" | "fade";
	duration?: number;
}

export type Action =
	| ActionTextType
	| ActionBackgroundType
	| ActionDelayType
	| ActionGoToSceneType
	| ActionDialogChoiceType
	| ActionPlayMusicType
	| ActionStopMusicType
	| ActionPlaySoundType
	| ActionSetVolumeType
	| ActionShowCharacterType
	| ActionHideCharacterType
	| ActionMoveCharacterType
	| ActionSetVariableType
	| ActionConditionType
	| ActionRandomBranchType
	| ActionEffectType;
