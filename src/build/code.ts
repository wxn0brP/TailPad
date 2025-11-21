import esbuild from "esbuild";
import stylePlugin from "esbuild-style-plugin";
import { baseDir, isDev, outdir } from "./config";

export async function buildCode() {
    await esbuild.build({
        entryPoints: [
            baseDir + "src/game-bundle/index.ts"
        ],
        outdir: outdir,
        format: "esm",
        target: "es2022",
        bundle: true,
        sourcemap: true,
        external: ["@wxn0brp/vql-client"],
        splitting: true,
        minify: !isDev,
        plugins: [
            stylePlugin({
                renderOptions: {
                    sassOptions: {
                        silenceDeprecations: ["legacy-js-api"],
                        style: "compressed"
                    }
                }
            })
        ],
    });
}