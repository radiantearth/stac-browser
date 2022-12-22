<template>
  <section class="browse d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>
      <p>{{ $t('errors.noExternalAccess') }}</p>
    </b-alert>
    <ErrorAlert v-if="error" :dismissible="false" :url="url" :description="errorDescription" :id="errorId" />
    <Loading v-else-if="loading" stretch />
    <component v-else :is="component" />
  </section>
</template>

<script>
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { mapGetters, mapState } from "vuex";
import Utils, { BrowserError } from '../utils';

export default {
  name: "Browse",
  components: {
    ErrorAlert,
    Loading,
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

<style lang="scss" scoped>
.browse {
  min-height: 100%;
}
</style>