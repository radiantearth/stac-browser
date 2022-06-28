import Vue from "vue";
import StacBrowser from "./StacBrowser.vue";

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(StacBrowser),
}).$mount("#stac-browser");
