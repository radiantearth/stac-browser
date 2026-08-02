import defaultConfig from "../config.js";
import externalConfig from "@stac-browser-external-config";

export default Object.assign(
  {},
  defaultConfig,
  externalConfig,
  CONFIG_FROM_ENV,
  window.STAC_BROWSER_CONFIG
);
