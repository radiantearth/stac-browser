<template>
  <main class="browse d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>{{ $t('errors.noExternalAccess') }}</b-alert>
    <ErrorAlert v-else-if="error" :dismissible="false" :url="url" :description="errorDescription" :id="errorId" />
    <Loading v-else-if="loading" stretch />
    <component v-else :is="component" />
  </main>
</template>

<script>
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import Item from './Item.vue';
import Catalog from './Catalog.vue';
import { mapGetters, mapState } from "vuex";
import Utils, { BrowserError } from '../utils';
import URI from 'urijs';

export default {
  name: "Browse",
  components: {
    ErrorAlert,
    Loading,
    Catalog,
    Item
  },
  props: {
    path: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState(["allowExternalAccess", "url", "data", "redirectLegacyUrls"]),
    ...mapGetters(["fromBrowserPath", "isItem", "error", "loading"]),
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
      if (this.error instanceof Error && this.error.isAxiosError && Utils.isObject(this.error.response)) {
        let res = this.error.response;
        if (Utils.isObject(res.data) && typeof res.data.description === 'string') { // STAC API compliant error response
          return res.data.description;
        }
        if (res.status === 401) {
          return this.$t('errors.unauthorized');
        }
        else if (res.status === 403) {
          return this.$t('errors.forbidden');
        }
        else if (res.status === 404) {
          return this.$t('errors.notFound');
        }
        else if (res.status > 500) {
          return this.$t('errors.serverError');
        }
        else if (res.status > 400) {
          return this.$t('errors.badRequest');
        }
      }
      else if (this.error instanceof BrowserError) {
        return this.error.message;
      }

      return this.$t('errors.networkError');
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
      return URI(this.path).is("absolute");
    }
  },
  watch: {
    path: {
      immediate: true,
      async handler(path, oldPath) {
        if (path === oldPath) {
          return;
        }
        else if (!this.allowExternalAccess && this.isExternal) {
          return;
        }
        else if (this.redirectLegacyUrls && await this.redirectLegacyUrl(path)) {
          return;
        }

        let url = this.fromBrowserPath(path || '/');
        this.$store.dispatch("load", { url, show: true, loadApi: true });
      }
    }
  },
  methods: {
    async redirectLegacyUrl(path) {
      if (!path || path === '/') {
        return false;
      }
      // Split all subpaths and remove the leading item or collection prefixes from the old STAC Browser routes
      let parts = path.split('/').filter(part => part.length > 0 && part !== 'item' && part !== 'collection');
      // Make sure all remaining parts are valid base58, otherwise they likely no legacy URLs
      if (parts.length > 0 && parts.every(part => part.match(/^[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/))) {
        // Lazy load base58 so that it's only in the loaded when really needed
        const { decode } = await import('bs58');
        // Decode last path element from base58, the others parts are not relevant for us
        let newPath = decode(parts[parts.length - 1]).toString();
        if (newPath) {
          let uri = URI(newPath);
          // Navigate to new URL
          this.$router.replace({
            // Remove trailing collections or items paths from APIs
            path: '/' + uri.path().replace(/(collections|items)\/?$/, ''),
            query: uri.query(true)
          });
          return true;
        }
      }
      return false;
    }
  }
};
</script>
