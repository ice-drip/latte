interface SVGItem {
  namespace: string;
  literal: string;
  iconName: string;
}

const Svg = (svgList: SVGItem[]) =>
  class SvgComponent extends HTMLElement {
    public readonly svgList: SVGItem[] = svgList;
    connectedCallback() {
      const namespace = this.getAttribute("namespace") ?? "default";
      const iconName = this.getAttribute("name");
      if (iconName) {
        const svg = this.svgList.find((icon) => icon.iconName === iconName && icon.namespace === namespace);
        if (svg) {
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1">${svg.literal}</svg>`;
        }
      }else{
        throw new Error("SVG name is required");
      }
    }
  };
export { Svg,SVGItem };
