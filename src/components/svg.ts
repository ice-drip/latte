interface SVGItem {
  namespace: string;
  literal: string;
  iconName: string;
  viewBox: string;
  height: number;
  width: number;
}

const Svg = (svgList: SVGItem[]) =>
  class SvgComponent extends HTMLElement {
    public readonly svgList: SVGItem[] = svgList;

    static get observedAttributes() {
      return ["name", "namespace", "width", "height"];
    }

    connectedCallback() {
      this.initHTML();
    }

    attributeChangedCallback(
      name: string,
      _oldValue: string,
      _newValue: string
    ) {
      const attrs = new Set(["namespace", "name", "width", "height"]);
      if (attrs.has(name)) {
        this.initHTML();
      }
    }

    initHTML() {
      const namespace = this.getAttribute("namespace") ?? "default";
      const iconName = this.getAttribute("name");
      const width = this.getAttribute("width");
      const height = this.getAttribute("height");

      if (iconName && namespace && width && height) {
        const svg = this.svgList.find(
          (icon) => icon.iconName === iconName && icon.namespace === namespace
        );
        if (svg) {
          const style =
            width && height
              ? `width:${width};height:${height};`
              : `width:${svg.width}px;height:${svg.height}px;`;
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="${style}" viewBox="${svg.viewBox}">${svg.literal}</svg>`;
        }
      }
    }
  };
export { Svg, SVGItem };
