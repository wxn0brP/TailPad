import { renderHTML } from "@wxn0brp/falcon-frame";
import { writeFileSync } from "fs";
import { baseDir, config, outdir } from "./config";
import { minify } from "html-minifier-terser";

export async function buildHtml() {
    const html = renderHTML(baseDir + "src/game-bundle/index.html", {
        title: config.title ?? "Tail Pad Game",
        scripts: (config.scripts ?? []).map(s => (`<script type="module" src="${s}"></script>`)).join(""),
        styles: (config.styles ?? []).map(s => (`<link rel="stylesheet" href="${s}">`)).join(""),
        icon: (config.icon ? `<link rel="icon" href="${config.icon}">` : ""),
        head: config.head ?? "",
        body: config.body ?? "",
    });
    const min = await minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
    });
    writeFileSync(outdir + "/index.html", min);
}