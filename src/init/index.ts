#!/usr/bin/env bun

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { basename, join, resolve } from "path";
import { parseArgs } from "node:util";

const { positionals, values } = parseArgs({
	allowPositionals: true,
	options: {
		title: {
			type: "string",
			short: "t",
		},
		force: {
			type: "boolean",
			short: "f",
			default: false,
		},
		help: {
			type: "boolean",
			short: "h",
			default: false,
		},
	},
});

if (values.help) {
	console.log(`
Usage: tailpad-init [options] [dir]

Arguments:
  dir                   The directory to create the project in

Options:
  -t, --title <title>   Set the title of the project
  -f, --force           Overwrite existing files
  -h, --help            Show help
`);
	process.exit(0);
}

const dirArg = positionals[0] ?? "";
const titleArg = values.title ?? "";
const force = values.force === true;

const projectDir = resolve(dirArg || process.cwd());
const folderName = basename(projectDir) || "tailpad-game";
const title = titleArg || folderName.replace(/[-_]+/g, " ");
const slug =
	folderName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "tailpad-game";
const configPath = join(projectDir, "config.json5");

if (existsSync(configPath) && !force) {
	console.error(`Project already initialized: ${projectDir}`);
	console.error("Use --force to overwrite generated files.");
	process.exit(1);
}

mkdirSync(projectDir, {
	recursive: true,
});

for (const dir of [
	"assets/scenes",
	"assets/bg",
	"assets/char",
	"assets/audio",
	"assets/ui",
]) {
	mkdirSync(join(projectDir, dir), {
		recursive: true,
	});
}

function write(relativePath: string, content: string) {
	const path = join(projectDir, relativePath);
	if (existsSync(path) && !force) {
		console.log(`Skipped existing ${relativePath}`);
		return;
	}
	writeFileSync(path, content);
}

const config = `{
	title: ${JSON.stringify(title)},
	icon: "./assets/ui/icon.svg",
	outdir: "build",
	styles: [],
	scripts: [],
	head: "",
	body: "",
}
`;

const scene = JSON.stringify(
	[
		{
			type: "text",
			text: "Hello, world!",
		},
	],
	null,
	"\t",
);

const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
	<rect width="64" height="64" rx="12" fill="#1b1a17"/>
	<rect x="16" y="14" width="32" height="36" rx="4" fill="none" stroke="#e8dfc8" stroke-width="4"/>
	<path d="M24 24h16M24 32h16M24 40h10" stroke="#e8dfc8" stroke-width="3" stroke-linecap="round"/>
</svg>
`;

const readme = `# ${title}

Visual novel project built with TailPad.

## Edit

From this directory:

\`\`\`bash
TAILPAD_TOKEN=your-secret tailpad-server
\`\`\`

## Build

\`\`\`bash
tailpad-bundle
\`\`\`

The result goes to the \`outdir\` from \`config.json5\` (by default \`build/\`).

## Layout

- \`config.json5\` - title, icon, styles, scripts and build output directory,
- \`assets/scenes/\` - one JSON array of actions per scene,
- \`assets/bg/\`, \`assets/char/\`, \`assets/audio/\`, \`assets/ui/\` - game assets.
`;

write("config.json5", config);
write("assets/scenes/master.json", scene + "\n");
write("assets/ui/icon.svg", icon);
write("README.md", readme);
write(".gitignore", "node_modules\nbuild\n");

console.log(`Initialized TailPad project in ${projectDir}`);
console.log("");
console.log("Next steps:");
console.log(dirArg ? `  cd ${dirArg}` : "  stay in the current directory");
console.log("  TAILPAD_TOKEN=your-secret tailpad-server");
console.log("  tailpad-bundle");
