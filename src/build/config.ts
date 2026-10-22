import { readFileSync } from "fs";
import JSON5 from "json5";
import { parseArgs } from "node:util";
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

const { values, positionals } = parseArgs({
	args: process.argv.slice(2),
	allowPositionals: true,
	options: {
		dev: {
			type: "boolean",
			default: false,
		},
	},
});

export const projectDir = resolve(positionals[0] ?? process.cwd());
export const isDev = values.dev === true;
export const config = JSON5.parse(
	readFileSync(resolve(projectDir, "config.json5"), "utf-8"),
) as Config;
export const assetsDir = resolve(projectDir, "assets");
export const outdir = resolve(projectDir, config.outdir ?? "game-build") + "/";
export const baseDir = import.meta.dirname + "/../../";
