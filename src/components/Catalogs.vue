<template>
  <section class="catalogs mb-4">
    <h2>
      Catalogs
      <template v-if="!hasMore">({{ catalogs.length }})</template>
      <ViewButtons class="ml-4" v-model="view" />
      <SortButtons v-if="!hasMore" class="ml-2" v-model="sort" />
    </h2>
    <component :is="cardsComponent" v-bind="cardsComponentProps">
      <Catalog v-for="catalog in sortedCatalogs" :catalog="catalog" :key="catalog.href" />
    </component>
    <b-button v-if="hasMore" @click="loadMore" variant="primary" v-b-visible.200="loadMore">Load more...</b-button>
  </section>
</template>

<script>
import Catalog from './Catalog.vue';
import STAC from '../stac';
import ViewMixin from './ViewMixin';

export default {
  name: "Catalogs",
  mixins: [
    ViewMixin
  ],
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
      if (!this.hasMore && this.sort !== 0) {
        catalogs = catalogs.slice(0).sort((a,b) => STAC.getDisplayTitle(a).localeCompare(STAC.getDisplayTitle(b)));
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
