import { db } from "#db";
import { writeFileSync } from "fs";
import { outdir } from "./config";

export async function buildDb() {
    const scenes = await db.data.find();
    for (const scene of scenes) {
        writeFileSync(outdir + "assets/scenes/" + scene._id + ".json", JSON.stringify(scene.sceneConfig));
    }
}
