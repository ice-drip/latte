import { readFileSync } from "fs";
import { optimize, Output, PluginConfig } from "svgo";
import { walkSync } from "@nodelib/fs.walk";
import { basename, resolve, sep } from "path";
import fse from "fs-extra";
import { SVGItem } from "../src";
import { groupBy } from "lodash";
import {format} from "prettier";

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "latte.config.json")).toString()
);
if (!config["svg"] || !config["dist"]) {
  throw new Error("svg|dist config is not defined");
}

const pathWalk = walkSync(config.svg).filter((item) =>
  item.path.endsWith(".svg")
);

const isColor = (path: string) => {
  if (config.color && config.color.length) {
    const _path = path.split(sep).join("/");
    return (config.color as string[]).some((item) => {
      return _path.startsWith(item);
    });
  }
  return false;
};

const list: SVGItem[] = pathWalk
  .map((item) => {
    const origin = readFileSync(resolve(process.cwd(), item.path)).toString();
    const literal = getSvgData(origin, isColor(item.path));
    let namespace = "default";
    if (config["namespace"]) {
      const paths = item.path.split(sep);
      namespace = paths[paths.length - 2];
    }

    const iconName = basename(item.path)
      .replace(".svg", "")
      .replaceAll(
        /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/gim,
        "_"
      )
      .replaceAll(" ", "_");
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
    .map(
      (item) =>
        `import { ${item.namespace}_${item.iconName} } from "./${item.namespace}/${item.iconName}";`
    )
    .join("\n") + "\n";

let allIcon = list
  .map((item) => `${item.namespace}_${item.iconName},`)
  .join("\n");
allIcon = allIcon.substring(0, allIcon.lastIndexOf(","));
const allIconVar =
  `const all_icon = [
${allIcon}
];
export { all_icon };
` + "\n";

const workspaceIcon = groupBy(list, "namespace");
const workspaceVar = Object.keys(workspaceIcon)
  .map((key) => {
    let wsIcon = workspaceIcon[key]
      .map((item) => `${item.namespace}_${item.iconName},`)
      .join("\n");
    wsIcon = wsIcon.substring(0, wsIcon.lastIndexOf(","));
    return `export const ws_${key}_icon = [
    ${wsIcon}
  ];`+"\n";
  })
  .join("\n");

const exportData = "export {\n" + allIcon + "\n};\n";
const outputText = format(indexFile + allIconVar + workspaceVar + exportData)
fse.outputFileSync(
  resolve(config["dist"], "index.ts"),
  outputText
);

function getSvgData(svgStr: string, color?: boolean) {
  let _width = "0";
  let _height = "0";
  const plugins: PluginConfig[] = [
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
    "convertShapeToPath",
    "removeDoctype",
    { name: "convertPathData", params: { forceAbsolutePath: false } },
    {
      name: "find-size",
      fn: () => {
        return {
          element: {
            enter: (node, parentNode) => {
              if (parentNode.type === "root") {
                _width = node.attributes.width;
                _height = node.attributes.height;
              }
            },
          },
        };
      },
    },
  ];
  if (color) {
    plugins.push({
      name: "removeAttrs",
      params: {
        attrs: "(fill|stroke)",
      },
    });
  }
  const result = optimize(svgStr, {
    multipass: true,
    plugins,
  });
  const viewBox = getViewBox(result, parseInt(_height), parseInt(_width));

  const svg = result.data.replace(/<svg[^>]+>/gi, "").replace(/<\/svg>/gi, "");
  const width = parseInt(_width) || 16;
  const height = parseInt(_height) || 16;
  return { svg, viewBox, width, height };
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

export const ${svgItem.namespace === "default" ? "" : svgItem.namespace + "_"}${
    svgItem.iconName
  }:SVGItem = {
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

function getViewBox(svgoResult: Output, height: number, width: number) {
  let viewBoxMatch = svgoResult.data.match(
    /viewBox="([-\d\.]+\s[-\d\.]+\s[-\d\.]+\s[-\d\.]+)"/
  );
  let viewBox: string = "0 0 200 200";

  if (viewBoxMatch && viewBoxMatch.length > 1) {
    viewBox = viewBoxMatch[1];
  } else if (height && width) {
    viewBox = `0 0 ${width} ${height}`;
  }

  return viewBox;
}
