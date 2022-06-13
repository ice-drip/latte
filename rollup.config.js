import typescript2 from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
const rollupConfig = [
  {
    input: "./src/index.ts",
    plugins: [typescript2(), resolve()],
    output: [
      {
        format: "cjs",
        sourcemap: true,
        preserveModules: true,
        dir: "dist/cjs",
      },
      {
        format: "esm",
        sourcemap: true,
        preserveModules: true,
        dir: "dist/esm",
      },
      {
        format: "umd",
        name: "ristretto",
        sourcemap: true,
        file: "dist/umd/index.umd.js",
      },
    ],
  },
  {
    input: "src/index.ts",
    plugins: [dts()],
    output: [{ file: "dist/typings/index.d.ts", format: "es" }],
  },
];

export default rollupConfig;
