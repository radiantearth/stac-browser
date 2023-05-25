<template>
  <section class="catalogs mb-4">
    <h2>
      <span class="title">{{ $tc('stacCatalog', catalogs.length ) }}</span>
      <b-badge v-if="isComplete" pill variant="secondary ml-2">
        <template v-if="catalogs.length !== catalogView.length">{{ catalogView.length }}/{{ catalogs.length }}</template>
        <template v-else>{{ catalogs.length }}</template>
      </b-badge>
      <ViewButtons class="ml-4" v-model="view" />
      <SortButtons v-if="isComplete && catalogs.length > 1" class="ml-2" v-model="sort" />
    </h2>
    <SearchBox v-if="isComplete && catalogs.length > 1" class="mt-3 mb-2" v-model="searchTerm" :placeholder="$t('catalogs.filterByTitle')" />
    <b-alert v-if="searchTerm && catalogView.length === 0" variant="warning" show>{{ $t('catalogs.noMatches') }}</b-alert>
    <component :is="cardsComponent" v-bind="cardsComponentProps">
      <Catalog v-for="catalog in catalogView" :catalog="catalog" :key="catalog.href" />
    </component>
    <b-button v-if="hasMore" @click="loadMore" variant="primary" v-b-visible.300="loadMore">{{ $t('catalogs.loadMore') }}</b-button>
  </section>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
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
    ...mapState(['cardViewSort', 'uiLanguage']),
    ...mapGetters(['getStac']),
    isComplete() {
      return !this.hasMore;
    },
    catalogView() {
      if (this.hasMore) {
        return this.catalogs;
      }
      let catalogs = this.catalogs.map(catalog => {
          let stac = this.getStac(catalog);
          return stac ? stac : catalog;
      });
      // Filter
      if (this.searchTerm) {
        catalogs = catalogs.filter(catalog => {
          let haystack = [ catalog.title ];
          if (catalog instanceof STAC) {
            haystack.push(catalog.id);
            if (Array.isArray(catalog.keywords)) {
              haystack = haystack.concat(catalog.keywords);
            }
          }
          else {
            haystack.push(catalog.href);
          }
          return Utils.search(this.searchTerm, haystack);
        });
      }
      // Sort
      if (!this.hasMore && this.sort !== 0) {
        catalogs = catalogs.slice(0).sort((a,b) => STAC.getDisplayTitle(a).localeCompare(STAC.getDisplayTitle(b), this.uiLanguage));
        if (this.sort === -1) {
          catalogs = catalogs.reverse();
        }
      }
      return catalogs;
    }
  },
  created() {
    this.sort = this.cardViewSort;
  },
  methods: {
    loadMore(visible = true) {
      if (visible) {
        // Disable sorting if pagination is/was active as otherwise the order of elements
        // may change unexpectedly after the last page has been loaded.
        this.sort = 0;
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