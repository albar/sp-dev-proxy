import fs from "fs-extra";
import * as path from "path";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import babel, { getBabelOutputPlugin } from "@rollup/plugin-babel";
import html from "@open-wc/rollup-plugin-html";

const proxyOutput = "pages";
const clientOutput = "dist";

// (function cleanup() {
//   const proxyoutputpath = path.join(__dirname, proxyOutput);
//   const clientOutputpath = path.join(__dirname, clientOutput);
//   fs.remove(proxyoutputpath);
//   fs.remove(clientOutputpath);
// })();

function emitassets() {
  return {
    writeBundle({ dir }, bundle) {
      const files = Object.keys(bundle)
        .filter((file) => file !== "proxy.html")
        .map((file) => path.join(__dirname, dir, file));

      for (const file of files) {
        console.log(file);
        fs.remove(file);
      }
    },
  };
}

const ProxyConfig = {
  input: "./src/proxy.ts",
  output: {
    dir: proxyOutput,
    plugins: [
      getBabelOutputPlugin({
        presets: [
          [
            "@babel/preset-env",
            {
              useBuiltIns: "entry",
              corejs: 3,
              modules: "umd",
              targets: "ie 9"
            },
          ],
        ],
      }),
      emitassets(),
    ],
  },
  plugins: [
    babel({
      babelHelpers: "bundled",
    }),
    typescript(),
    resolve(),
    html({
      name: "proxy.html",
      inject: false,
      template({ bundle }) {
        return new Promise((resolve) => {
          const filepath = path.resolve(__dirname, "proxy.html");
          fs.readFile(filepath, "utf-8", (_, data) => {
            const result = data.replace(
              "</body>",
              `
              ${bundle.entrypoints.map(
                (e) => `<script>${e.chunk.code}</script>`
              )}
              </body>
            `
            );

            resolve(result);
          });
        });
      },
    }),
  ],
};

const ClientConfig = {
  input: "./src/client.ts",
  output: {
    file: path.join(clientOutput, 'index.js'),
    plugins: [
      getBabelOutputPlugin({
        presets: [
          [
            "@babel/preset-env"
          ],
        ],
      })
    ],
  },
  plugins: [
    babel({
      babelHelpers: "bundled",
    }),
    typescript(),
    resolve()
  ],
};

export default [ProxyConfig, ClientConfig];
