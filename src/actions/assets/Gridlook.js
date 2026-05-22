import AssetActionPlugin from "../AssetActionPlugin.js";
import { URI } from "stac-js/src/utils.js";
import i18n from "../../i18n";

const GRIDLOOK_SUPPORTED_TYPES = [
  'application/vnd+zarr',
  'application/vnd.zarr',
];

export default class Gridlook extends AssetActionPlugin {
  get show() {
    return this.component.isBrowserProtocol && GRIDLOOK_SUPPORTED_TYPES.includes(this.asset.type)
  }

  get uri() {
    let uri = URI("https://grid4earth.github.io/gridlook/");
    const dataset_url = this.component.href;

    uri.hash(dataset_url);

    return uri;
  }

  get text() {
    return i18n.global.t("actions.openIn", { service: "gridlook" });
  }
}
