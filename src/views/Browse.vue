<template>
  <section>
    <b-alert v-if="!allowExternalAccess && this.isExternal">
      <p>Accessing external catalogs is not allowed!</p>
    </b-alert>
    <div v-if="loading" class="loading text-center">
      <b-spinner label="Loading..."></b-spinner>
    </div>
    <b-alert v-else-if="error" variant="danger" show>
      <p>{{ error }}</p>
      <p>
        Please note that some servers don't allow external access via web
        browsers (e.g., when CORS headers are not present).
      </p>
      <p>
        <small>Requested URL: <a :href="url">{{ url }}</a></small>
      </p>
    </b-alert>
    <component v-else :is="component" />
  </section>
</template>

<script>
import { mapGetters, mapState } from "vuex";
import Utils from '../utils';

export default {
  name: "Browse",
  components: {
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
    ...mapState(["allowExternalAccess", "url", "redirectUrl"]),
    ...mapGetters(["isCatalogLike", "loading", "error"]),
    component() {
        return this.isCatalogLike ? 'Catalog' : 'Item'; 
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

        this.$store.dispatch("load", { url: path || '/', fromBrowser: true, show: true });
      }
    },
    redirectUrl: {
      immediate: true,
      handler(path) {
        console.log(path);
        if (!path) {
          return;
        }

        this.$router.replace({ path });
      }
    }
  }
};
</script>