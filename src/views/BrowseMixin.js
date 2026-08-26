import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { getErrorCode, getErrorMessage } from '../store/utils';
import { URI } from 'stac-js/src/utils.js';
import { mapState, mapGetters } from 'vuex';

const isExternalPath = path => URI(path || '/').is("absolute");

export default {
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
    ...mapState(["allowExternalAccess", "catalogUrl", "loading", "locale", "url"]),
    ...mapGetters(["fromBrowserPath", "error", "isLocalizedCatalogUrl"]),
    errorId() {
      return getErrorCode(this.error);
    },
    errorDescription() {
      return getErrorMessage(this.error);
    },
    isExternal() {
      return isExternalPath(this.path);
    }
  },
  watch: {
    path: {
      immediate: true,
      async handler(path, oldPath) {
        if (path === oldPath) {
          return;
        }
        await this.browse(path);
      }
    }
  },
  methods: {
    async browse(path) {
      // This has to run after the created() method in StacBrowser.vue.
      // Thus we have to wait here for the router to be ready so that
      // we can ensure parseQuery in StacBrowser.vue has been called
      // and the query parameters for the request are set in the store.
      // https://github.com/radiantearth/stac-browser/issues/822#issuecomment-4068820575
      await this.$router.isReady();
      const url = this.fromBrowserPath(path || '/');

      // Locale alternates advertised by the configured catalog remain trusted
      // even when arbitrary external access is disabled. Establish that root
      // context before deciding whether an encoded external path is allowed.
      if (!this.allowExternalAccess && isExternalPath(path)) {
        if (!this.isLocalizedCatalogUrl(url)) {
          await this.$store.dispatch('switchCatalogRootLocale', { locale: this.locale });
        }
        if (!this.isLocalizedCatalogUrl(url)) {
          return;
        }
      }

      await this.$store.dispatch('load', { url, show: true });
    }
  }
};
