<template>
  <section class="catalogs mb-4">
    <h2>
      <span class="title">Catalogs</span>
      <b-badge v-if="!hasMore" pill variant="secondary ml-2">{{ catalogs.length }}</b-badge>
      <ViewButtons class="ml-4" v-model="view" />
      <SortButtons v-if="!hasMore" class="ml-2" v-model="sort" />
    </h2>
    <SearchBox v-if="!hasMore" class="mt-3 mb-2" v-model="searchTerm" placeholder="Search catalogs" />
    <b-alert v-if="searchTerm && catalogView.length === 0" variant="warning" show>No catalogs found for the given search term.</b-alert>
    <component :is="cardsComponent" v-bind="cardsComponentProps">
      <Catalog v-for="catalog in catalogView" :catalog="catalog" :key="catalog.href" />
    </component>
    <b-button v-if="hasMore" @click="loadMore" variant="primary" v-b-visible.200="loadMore">Load more...</b-button>
  </section>
</template>

<script>
import Catalog from './Catalog.vue';
import STAC from '../models/stac';
import ViewMixin from './ViewMixin';
import Utils from '../utils';

export default {
  name: "Catalogs",
  components: {
    Catalog,
    SearchBox: () => import('./SearchBox.vue'),
    SortButtons: () => import('./SortButtons.vue')
  },
  mixins: [
    ViewMixin
  ],
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
			searchTerm: '',
      sort: 0
    };
  },
  computed: {
    catalogView() {
      if (this.hasMore) {
        return this.catalogs;
      }
      let catalogs = this.catalogs;
      // Filter
      if (this.searchTerm) {
        catalogs = catalogs.filter(catalog => Utils.search(this.searchTerm, [catalog.id, catalog.title].concat(catalog.keywords || [])));
      }
      // Sort
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

<style lang="scss" scoped>
.catalogs > h2 {
  .title, .badge {
    vertical-align: middle;
  }
}
</style>