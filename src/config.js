import configFromFile from "../config.js";

export default Object.assign(
  configFromFile,
  CONFIG_FROM_ENV,
  window.STAC_BROWSER_CONFIG
);
