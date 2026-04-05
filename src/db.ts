import { ValtheraCreate } from "@wxn0brp/db";

export const db = ValtheraCreate<{
    data: {
        _id: string;
        sceneConfig: any[];
    }
}>("data/master");
