import { readFileSync } from "fs";
import { optimize } from "svgo";
import { walkSync } from "@nodelib/fs.walk";
import { basename, resolve, sep } from "path";
import fse from "fs-extra";
import { SVGItem } from "../src";

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "latte.config.json")).toString()
);
if (!config["svg"] || !config["dist"]) {
  throw new Error("svg|dist config is not defined");
}

const pathWalk = walkSync(config.svg).filter((item) =>
  item.path.endsWith(".svg")
);
const list: SVGItem[] = pathWalk
  .map((item) => {
    const literal = getSvgData(
      readFileSync(resolve(process.cwd(), item.path)).toString()
    );
    let namespace = "default";
    if (config["namespace"]) {
      const paths = item.path.split(sep);
      namespace = paths[paths.length - 2];
    }
    const iconName = basename(item.path).replace(".svg", "");
    return { namespace, literal, iconName };
  })
  .filter((item) => item.literal) as SVGItem[];

console.log(list);
list.some((item) => {
  saveDist(item);
});
function getSvgData(svgStr: string) {
  const result = optimize(svgStr, {
    multipass: true,
    plugins: [
      {
        name: "removeAttrs",
        params: {
          attrs: "(fill|stroke)",
        },
      },
      "removeTitle",
      "inlineStyles",
      "convertStyleToAttrs",
      "removeStyleElement",
      "removeComments",
      "removeDesc",
      "removeUselessDefs",
      "cleanupIDs",
      "convertShapeToPath",
    ],
  });
  if (result.error === undefined) {
    const svg = result.data
      .replace(/<svg[^>]+>/gi, "")
      .replace(/<\/svg>/gi, "");
    return svg;
  }
  return null;
}

function saveDist(svgItem: SVGItem) {
  let filename = "";

  if (svgItem.namespace === "default") {
    filename = resolve(config["dist"], svgItem.iconName + ".ts");
  } else {
    filename = resolve(
      config["dist"],
      svgItem.namespace,
      svgItem.iconName + ".ts"
    );
  }
  const file = `import {SVGItem} from "@kaffee/latte"

export const ${svgItem.iconName} = {
    namespace: "${svgItem.namespace}",
    literal: \`${svgItem.literal}\`,
    iconName: "${svgItem.iconName}"
}`;
  fse.outputFileSync(filename, file);
}
