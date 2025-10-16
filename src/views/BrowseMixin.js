import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import Utils, { BrowserError } from '../utils';
import URI from 'urijs';
import { defineComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';

export default defineComponent({
  components: {
    ErrorAlert,
    Loading
  },
  props: {
    path: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapState(["allowExternalAccess", "catalogUrl", "loading", "url"]),
    ...mapGetters(["fromBrowserPath", "error"]),
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

        let url = this.fromBrowserPath(path || '/');
        this.$store.dispatch("load", { url, show: true });
      }
    }
  }
});
