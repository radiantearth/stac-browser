import Vue from "vue";
import init from "./init";

// Auth
import { auth } from "./auth/auth";
let enableAuth = process.env.VUE_APP_ENABLE_AUTH || false;
if (enableAuth !== false) {
  auth();
}

Vue.config.productionTip = false;

init();
