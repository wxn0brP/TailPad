#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { buildCode } from "./code";
import { outdir } from "./config";
import { buildHtml } from "./html";
import { buildDb } from "./db";

if (existsSync(outdir)) rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

await buildCode();
await buildHtml();

if (existsSync("assets")) cpSync("assets", outdir + "assets", { recursive: true });

if (!existsSync(outdir + "assets/scenes")) mkdirSync(outdir + "assets/scenes", { recursive: true });
await buildDb();