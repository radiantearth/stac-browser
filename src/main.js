import Vue from "vue";
import StacBrowser from "./StacBrowser.vue";
import i18n from './i18n';

Vue.config.productionTip = false;

new Vue({
  i18n,
  render: (h) => h(StacBrowser)
}).$mount("#stac-browser");
