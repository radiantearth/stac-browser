<template>
  <section class="catalogs mb-4">
    <h2>
      Catalogs
      <template v-if="!hasMore">({{ catalogs.length }})</template>
      <SortButtons class="ml-4" v-model="sort" />
    </h2>
    <b-card-group columns>
      <Catalog v-for="catalog in sortedCatalogs" :catalog="catalog" :key="catalog.href" />
    </b-card-group>
    <b-button v-if="hasMore" @click="loadMore" variant="primary" v-b-visible.200="loadMore">Load more...</b-button>
  </section>
</template>

<script>
import Catalog from './Catalog.vue';

export default {
  name: "Catalogs",
  components: {
    Catalog,
    SortButtons: () => import('./SortButtons.vue')
  },
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    hasMore: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      sort: 0
    };
  },
  computed: {
    sortedCatalogs() {
      let catalogs = this.catalogs;
      if (this.sort !== 0) {
        catalogs = catalogs.slice(0).sort((a,b) => {
          return (a.title || a.id || "").localeCompare((b.title || b.id || ""));
        });
        if (this.sort === -1) {
          catalogs = catalogs.reverse();
        }
      }
      return catalogs;
    }
  },
  methods: {
    loadMore(visible = true) {
      if (visible) {
        this.$emit('loadMore');
      }
    }
  }
};
</script>
