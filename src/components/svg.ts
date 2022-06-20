interface SVGItem {
  namespace: string;
  literal: string;
  iconName: string;
  viewBox: string;
  height:number;
  width:number;
}

const Svg = (svgList: SVGItem[]) =>
  class SvgComponent extends HTMLElement {
    public readonly svgList: SVGItem[] = svgList;
    connectedCallback() {
      const namespace = this.getAttribute("namespace") ?? "default";
      const iconName = this.getAttribute("name");
      const width = this.getAttribute("width");
      const height = this.getAttribute("height");
      
      if (iconName) {
        const svg = this.svgList.find((icon) => icon.iconName === iconName && icon.namespace === namespace);
        if (svg) {
          const style = width&&height?`width:${width};height:${height};`:`width:${svg.width}px;height:${svg.height}px;`;
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="${style}" viewBox="${svg.viewBox}">${svg.literal}</svg>`;
        }
      }else{
        throw new Error("SVG name is required");
      }
    }
  };
export { Svg,SVGItem };
