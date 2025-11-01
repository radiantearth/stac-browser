import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { getErrorCode, getErrorMessage } from '../store/utils';
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
      return getErrorCode(this.error);
    },
    errorDescription() {
      return getErrorMessage(this.$i18n, this.error);
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
