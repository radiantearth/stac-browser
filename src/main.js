import Vue from "vue";
import init from "./init";

// Auth
import { auth } from "./auth/auth";

// will be false unless NODE_ENV === 'production'
if (VUE_APP_ENABLE_AUTH) {
  auth();
}

Vue.config.productionTip = false;

init();
