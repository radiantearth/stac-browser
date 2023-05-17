import Vue from "vue";
import init from "./init";

// Auth
import { auth } from "./auth/auth";
auth();

Vue.config.productionTip = false;

init();
