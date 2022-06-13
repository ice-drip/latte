import {Svg, SVGItem} from "./components/svg"



function registerSvgIcon(svgList:SVGItem[]){
    customElements.define("latte-svg", Svg(svgList));
}

export {SVGItem,registerSvgIcon}