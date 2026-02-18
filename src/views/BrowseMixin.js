import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { getErrorCode, getErrorMessage } from '../store/utils';
import URI from 'urijs';
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useConfigStore } from '../store/config';
import { usePageStore } from '../store/page';
import { useCatalogStore } from '../store/catalog';

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
    ...mapState(useConfigStore, ['allowExternalAccess', 'catalogUrl']),
    ...mapState(usePageStore, ['loading', 'url', 'fromBrowserPath', 'error']),
    errorId() {
      return getErrorCode(this.error);
    },
    errorDescription() {
      return getErrorMessage(this.error);
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
        useCatalogStore().load({ url, show: true });
      }
    }
  }
});
