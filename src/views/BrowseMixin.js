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
    ...mapState(["allowExternalAccess", "catalogUrl", "loading", "url"]),
    ...mapGetters(["fromBrowserPath", "error"]),
    errorId() {
      return getErrorCode(this.error);
    },
    errorDescription() {
      return getErrorMessage(this.$i18n, this.error);
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
      // Check the given path, not the path property (i.e. this.isExternal)
      if (!this.allowExternalAccess && isExternalPath(path)) {
        return;
      }

      // This has to run after the created() method in StacBrowser.vue.
      // Thus we have to wait here for the router to be ready so that
      // we can ensure parseQuery in StacBrowser.vue has been called
      // and the query parameters for the request are set in the store.
      // https://github.com/radiantearth/stac-browser/issues/822#issuecomment-4068820575
      await this.$router.isReady();
      const url = this.fromBrowserPath(path || '/');
      await this.$store.dispatch('load', { url, show: true });
    }
  }
};
