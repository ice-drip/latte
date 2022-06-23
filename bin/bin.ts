import { readFileSync } from "fs";
import { optimize, OptimizedSvg } from "svgo";
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
    const origin = readFileSync(resolve(process.cwd(), item.path)).toString();
    const literal = getSvgData(origin);
    let namespace = "default";
    if (config["namespace"]) {
      const paths = item.path.split(sep);
      namespace = paths[paths.length - 2];
    }

    const iconName = basename(item.path).replace(".svg", "");
    return {
      namespace,
      literal: literal ? literal.svg : "",
      iconName,
      viewBox: literal ? literal.viewBox : "0 0 200 200",
      width: literal ? literal.width : 16,
      height: literal ? literal.height : 16,
    };
  })
  .filter((item) => item.literal);

list.some((item) => {
  saveDist(item);
});
const indexFile =
  list
    .map((item) => `export * from "./${item.namespace}/${item.iconName}";`)
    .join("\n") + "\n";

fse.outputFileSync(resolve(config["dist"], "index.ts"), indexFile);

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
      "removeMetadata",
      "removeUselessDefs",
      "removeXMLProcInst",
      "removeXMLNS",
      "cleanupIDs",
      "convertShapeToPath",
      "removeDoctype",
      { name: "convertPathData", params: { forceAbsolutePath: false } },
    ],
  });
  if (result.error === undefined) {
    const viewBox = getViewBox(result);

    const svg = result.data
      .replace(/<svg[^>]+>/gi, "")
      .replace(/<\/svg>/gi, "");
    const width = parseInt(result.info.width) || 16;
    const height = parseInt(result.info.height) || 16;
    return { svg, viewBox, width, height };
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

  let file = `/* eslint-disable ${config["eslint"] ? config["eslint"] : ""}*/
import {SVGItem} from "@kaffee/latte";

export const ${svgItem.namespace==="default"?"":svgItem.namespace+"_"}${svgItem.iconName}:SVGItem = {
    namespace: "${svgItem.namespace}",
    literal: \`${svgItem.literal}\`,
    iconName: "${svgItem.iconName}",
    viewBox: "${svgItem.viewBox}",
    height: ${svgItem.height},
    width: ${svgItem.width}
};
/* eslint-enable  ${config["eslint"] ? config["eslint"] : ""}*/
`;
  fse.outputFileSync(filename, file);
}

function getViewBox(svgoResult: OptimizedSvg) {
  let viewBoxMatch = svgoResult.data.match(
    /viewBox="([-\d\.]+\s[-\d\.]+\s[-\d\.]+\s[-\d\.]+)"/
  );
  let viewBox: string = "0 0 200 200";

  if (viewBoxMatch && viewBoxMatch.length > 1) {
    viewBox = viewBoxMatch[1];
  } else if (svgoResult.info.height && svgoResult.info.width) {
    viewBox = `0 0 ${svgoResult.info.width} ${svgoResult.info.height}`;
  }

  return viewBox;
}
