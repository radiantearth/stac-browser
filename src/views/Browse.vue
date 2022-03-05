<template>
  <section>
    <b-alert v-if="!allowExternalAccess && this.isExternal">
      <p>Accessing external catalogs is not allowed!</p>
    </b-alert>
    <ErrorAlert v-if="error" :dismissible="false" :url="url" :description="errorDescription" :id="errorId" />
    <div v-else-if="loading" class="loading text-center">
      <b-spinner label="Loading..."></b-spinner>
    </div>
    <component v-else :is="component" />
  </section>
</template>

<script>
import ErrorAlert from '../components/ErrorAlert.vue';
import { mapGetters, mapState } from "vuex";
import Utils from '../utils';

export default {
  name: "Browse",
  components: {
    ErrorAlert,
    Item: () => import(/* webpackChunkName: "item" */ "./Item.vue"),
    Catalog: () => import(/* webpackChunkName: "catalog" */ "./Catalog.vue")
  },
  props: {
    path: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState(["allowExternalAccess", "url", "redirectUrl", "data"]),
    ...mapGetters(["isItem", "error", "loading"]),
    errorId() {
      if (this.error instanceof Error && this.error.isAxiosError && Utils.isObject(this.error.response)) {
        let res = this.error.response;
        if (Utils.isObject(res.data) && res.data.code) {
          return res.data.code;
        }
        else {
          return res.status;
        }
      }
      return null;
    },
    errorDescription() {
      let contact = " Please contact the service operator to resolve this issue.";
      
      if (this.error instanceof Error && this.error.isAxiosError && Utils.isObject(this.error.response)) {
        let res = this.error.response;
        if (Utils.isObject(res.data)) {
          if (typeof res.data.description === 'string') { // STAC API compliant error response
            return res.data.description;
          }
          else if (typeof res.data.detail === 'string') { // stac-fastapi returns an invalid "detail" property, see https://github.com/stac-utils/stac-fastapi/issues/360
            return res.data.detail;
          }
        }
        if (res.status === 401) {
          return "The request lacks credentials, e.g. an API token. Please provide your credentials and try again.";
        }
        else if (res.status === 403) {
          return "The credentials specified for this request are invalid, e.g. an expired or invalid API token. Please provide other credentials and try again.";
        }
        else if (res.status === 404) {
          return "The requested resource does not exist." + contact;
        }
        else if (res.status > 500) {
          return "The server encountered an issue." + contact;
        }
        else if (res.status > 400) {
          return "The request is invalid. This might be due to invalid parameters, e.g. in a search request, or could be a bug in STAC Browser.";
        }
      }

      return "This issue may occur when servers don't allow external access via web browsers (e.g., when CORS headers are not present)." + contact;
    },
    component() {
      if (this.isItem) {
        return 'Item';
      }
      else {
        return 'Catalog';
      }
    },
    isExternal() {
      return Utils.urlType(this.path, "absolute");
    }
  },
  watch: {
    path: {
      immediate: true,
      handler(path, oldPath) {
        if (path === oldPath) {
          return;
        }

        this.$store.dispatch("load", { url: path || '/', fromBrowser: true, show: true, loadApi: true });
      }
    },
    redirectUrl: {
      immediate: true,
      handler(path) {
        if (!path) {
          return;
        }

        this.$router.replace({ path });
      }
    }
  }
};
</script>