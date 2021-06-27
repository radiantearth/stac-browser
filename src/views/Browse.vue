<template>
  <section>
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

export default {
  name: "Browse",
  components: {
      Item: () => import(/* webpackChunkName: "item" */ "./Item.vue"),
      Catalog: () => import(/* webpackChunkName: "catalog" */ "./Catalog.vue"),
  },
  props: {
    path: {
      type: String,
      default: ''
    }
  },
  computed: {
    ...mapState(["url"]),
    ...mapGetters(["isCatalogLike", "loading", "error"]),
    component() {
        return this.isCatalogLike ? 'Catalog' : 'Item'; 
    }
  },
  watch: {
    path: {
      immediate: true,
      handler(path, oldPath) {
        if (path !== oldPath) {
          this.$store.dispatch("load", { path, show: true });
        }
      },
    },
  }
};
</script>