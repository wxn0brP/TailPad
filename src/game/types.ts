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

export interface Choice {
    text: string;
    scene: string;
}

export interface ActionDialogChoiceType extends ActionBase {
    type: "dialog-choice";
    text: string;
    choices: Choice[];
}

export type Action =
    | ActionTextType
    | ActionBackgroundType
    | ActionDelayType
    | ActionGoToSceneType
    | ActionDialogChoiceType