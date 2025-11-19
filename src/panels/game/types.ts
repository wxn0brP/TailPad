export interface ActionBase {
    name: string;
    waitForEnd?: true;
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

export type Action = ActionTextType | ActionBackgroundType;