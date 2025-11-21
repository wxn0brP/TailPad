import { Valthera } from "@wxn0brp/db";
import { writeFileSync } from "fs";
import { outdir } from "./config";

const db = new Valthera("data/master");

export async function buildDb() {
    const scenes = await db.find("data");
    for (const scene of scenes) {
        writeFileSync(outdir + "assets/scenes/" + scene._id + ".json", JSON.stringify(scene.sceneConfig));
    }
}