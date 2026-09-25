import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { getErrorCode, getErrorMessage } from '../store/utils';
import { mapState, mapGetters } from 'vuex';

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
    ...mapGetters(["fromBrowserPath", "error", "isExternalUrl", "isLocalizedCatalogUrl"]),
    errorId() {
      return getErrorCode(this.error);
    },
    errorDescription() {
      return getErrorMessage(this.error);
    },
    isExternal() {
      const url = this.fromBrowserPath(this.path || '/');
      return this.isExternalUrl(url, false);
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
      let url = this.fromBrowserPath(path || '/');

      // Establish localized-root trust before loading an encoded external path.
      // Arbitrary external URLs remain blocked when external access is disabled.
      if (this.isExternalUrl(url, false)) {
        if (!this.isLocalizedCatalogUrl(url)) {
          await this.$store.dispatch('switchCatalogRootLocale', { locale: this.locale });
        }
        if (this.isLocalizedCatalogUrl(url)) {
          // The first decode happened before the localized root was trusted,
          // so decode again to attach route-local request parameters.
          url = this.fromBrowserPath(path || '/');
        }
        else if (!this.allowExternalAccess) {
          return;
        }
      }

      await this.$store.dispatch('load', { url, show: true });
    }
  }
};
