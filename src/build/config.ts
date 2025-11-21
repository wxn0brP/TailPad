import { readFileSync } from "fs";
import JSON5 from "json5";
import { resolve } from "path";

export interface Config {
    title: string;
    icon: string;
    outdir?: string;
    scripts?: string[];
    styles?: string[];
    head?: string;
    body?: string;
}

export const isDev = process.argv.includes("--dev");
export const config = JSON5.parse(readFileSync("config.json5", "utf-8")) as Config;
export const outdir = resolve(config.outdir ?? "game-build") + "/";
export const baseDir = import.meta.dirname + "/../../";