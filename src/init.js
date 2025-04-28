import Vue from "vue";
import StacBrowser from "./StacBrowser.vue";
import i18n, { loadDefaultMessages } from './i18n';

export default function init() {
  return loadDefaultMessages().then(() => {
    return new Vue({
      i18n,
      render: h => h(StacBrowser)
    }).$mount("#stac-browser");
  });
}
