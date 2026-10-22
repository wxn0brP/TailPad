#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { buildCode } from "./code";
import { assetsDir, outdir, projectDir } from "./config";
import { buildHtml } from "./html";

if (existsSync(outdir))
	rmSync(outdir, {
		recursive: true,
		force: true,
	});
mkdirSync(outdir, {
	recursive: true,
});

await buildCode();
await buildHtml();

if (!existsSync(assetsDir))
	throw new Error(`No assets directory in ${projectDir}`);

cpSync(assetsDir, outdir + "assets", {
	recursive: true,
});

if (!existsSync(outdir + "assets/scenes")) {
	console.warn(
		"No assets/scenes directory in project, game will not have scenes",
	);
	mkdirSync(outdir + "assets/scenes", {
		recursive: true,
	});
}
