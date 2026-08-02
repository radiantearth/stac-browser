<template>
  <ul class="tree" v-visible="load">
    <li>
      <b-button v-if="canLoadMore" size="sm" variant="light" v-visible.300="loadNextPage" @click="loadNextPage()">
        <b-spinner v-if="loadingMore" small :label="$t('loading')" />
        <b-icon-three-dots v-else />
      </b-button>
      <b-button v-else-if="pagination" size="sm" variant="light" disabled>
        <b-icon-three-dots />
      </b-button>
      <template v-else-if="mayHaveChildren">
        <b-button size="sm" variant="light" @click="toggle">
          <b-icon-folder-minus v-if="expanded" />
          <b-icon-folder-plus v-else />
        </b-button>
      </template>
      <b-button v-else size="sm" variant="light" :to="to">
        <b-icon-file-earmark-richtext />
      </b-button><!--
      
      --><b-button size="sm" variant="light" :class="{path: onPath || active}" :disabled="!to && !active" :to="to" @click="onClick">
        {{ title }}
      </b-button>

      <template v-if="expanded && mayHaveChildren">
        <ul v-if="loading" class="tree">
          <li><b-spinner :label="$t('loading')" small /></li>
        </ul>
        <ul v-else-if="childs.length === 0" class="tree">
          <li>
            <b-button size="sm" variant="light" disabled>
              {{ $t('tree.noChildren') }}
            </b-button>
          </li>
        </ul>
        <template v-else>
          <Tree v-for="(child, i) in shownChilds" :key="i" :item="child" :parent="stac" :path="path" />
          <b-button class="show-more" v-if="hasMore" variant="light" @click="showMore" v-visible.300="showMore">{{ $t('showMore') }}</b-button>
        </template>
      </template>
    </li>
  </ul>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { isObject } from 'stac-js/src/utils.js';
import { toAbsolute } from 'stac-js/src/http.js';
import Utils from '../utils';
import { getDisplayTitle, sortStac } from '../models/stac';
import { STAC } from 'stac-js';

export default {
  name: 'Tree',
  props: {
    item: {
      type: Object,
      required: true
    },
    parent: {
      type: Object,
      default: null
    },
    path: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      expanded: false,
      loading: false,
      chunk: 1
    };
  },
  computed: {
    ...mapState(['data', 'apiCatalogPriority', 'defaultCollectionSort', 'defaultItemSort', 'uiLanguage']),
    ...mapGetters(['getApiChildren', 'getChildren', 'getStac', 'isApiChildrenLoading', 'toBrowserPath']),
    onClick() {
      if (!this.to && this.mayHaveChildren) {
        return this.toggle;
      }
      return null;
    },
    stac() {
      if (this.pagination) {
        return null;
      }
      else if (this.item.isSTAC) {
        let stac = this.getStac(this.item.getAbsoluteUrl());
        if (!this.loading && stac) {
          return stac;
        }
        else {
          return this.item;
        }
      }
      else {
        return this.getStac(this.link);
      }
    },
    link() {
      if (this.pagination) {
        if (this.parent) {
          return this.parent.getAbsoluteUrl();
        }
        else {
          return null;
        }
      }
      else if (isObject(this.item) && typeof this.item.href === 'string') {
        if (this.parent) {
          return toAbsolute(this.item.href, this.parent.getAbsoluteUrl());
        }
        else {
          return this.item.href;
        }
      }
      return null;
    },
    mayHaveChildren() {
      if (this.item instanceof STAC) {
        return this.item.isCatalogLike;
      }
      else if (this.link) {
        return this.item.rel !== 'item';
      }
      return false;
    },
    to() {
      if (this.active) {
        return null;
      }
      if (this.pagination) {
        if (this.parent && (!this.data || this.parent.getAbsoluteUrl() !== this.data.getAbsoluteUrl())) {
          return this.toBrowserPath(this.parent);
        }
        else {
          return null;
        }
      }
      else if (this.stac instanceof STAC) {
        return this.toBrowserPath(this.stac);
      }
      return null;
    },
    title() {
      if (this.pagination) {
        return this.canLoadMore ? this.$t('catalogs.loadMore') : this.$t('tree.moreCollectionPagesAvailable');
      }
      return getDisplayTitle([this.item, this.stac]);
    },
    hasMore() {
      return this.childs.length > this.shownChilds.length;
    },
    childs() {
      if (this.stac?.isCatalogLike) {
        const children = this.getChildren(this.stac, this.apiCatalogPriority);
        if (children.length < 2) {
          return children;
        }

        const collectionSort = Utils.parseApiSortParameter(this.defaultCollectionSort);
        const itemSort = Utils.parseApiSortParameter(this.defaultItemSort);

        const prev = [];
        const next = [];
        const items = [];
        const catalogs = [];
        for (const child of children) {
          if (['prev', 'previous'].includes(child?.rel)) {
            prev.push(child);
          }
          else if (child?.rel === 'next') {
            next.push(child);
          }
          else if (child?.rel === 'item' || child?.isItem) {
            items.push(child);
          }
          else {
            catalogs.push(child);
          }
        }

        const sortedCatalogs = collectionSort.direction === 0 ? catalogs : sortStac(catalogs, collectionSort, this.uiLanguage);
        const sortedItems = itemSort.direction === 0 ? items : sortStac(items, itemSort, this.uiLanguage);

        return prev.concat(sortedCatalogs, sortedItems, next);
      }
      return [];
    },
    shownChilds() {
      return this.childs.slice(0, this.chunk * 50);
    },
    onPath() {
      if (!Array.isArray(this.path) || !this.stac) {
        return false;
      }
      return this.path.includes(this.stac);
    },
    active() {
      return this.stac && this.stac === this.data;
    },
    pagination() {
      return ['next', 'prev', 'previous'].includes(this.item.rel);
    },
    canLoadMore() {
      return this.item.rel === 'next' && this.getApiChildren(this.parent)?.type === 'collections';
    },
    loadingMore() {
      return this.isApiChildrenLoading(this.parent);
    }
  },
  watch: {
    onPath: {
      immediate: true,
      handler() {
        if (this.onPath) {
          this.expanded = true;
        }
      }
    }
  },
  created() {
    if (!this.parent) {
      this.expanded = true;
    }
  },
  methods: {
    showMore() {
      this.chunk++;
    },
    async loadNextPage(visible = true) {
      if (!visible || this.loadingMore) {
        return;
      }
      try {
        await this.$store.dispatch('loadNextApiCollections', { stac: this.parent, next: true });
      } catch (error) {
        this.$store.commit('showGlobalError', {
          error,
          message: this.$t('errors.loadApiCollectionsFailed')
        });
      }
    },
    load(visible) {
      if (!this.stac && this.link && !this.pagination) {
        this.$store.commit(visible ? 'queue' : 'unqueue', this.link);
      }
    },
    async toggle() {
      this.expanded = !this.expanded;
      if (this.expanded && !this.pagination) {
        this.loading = true;
        let url = this.item instanceof STAC ? this.item.getAbsoluteUrl() : this.item.href;
        await this.$store.dispatch('load', { url });
        this.loading = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.tree {
  list-style-type: none;
  margin: 0;
  padding: 0;

  :deep(.btn.disabled) {
    filter: none !important;
  }

  > li {
    white-space: nowrap;
  }

  .path {
    font-weight: bold;
  }

  .tree {
    margin-left: 1.5em;
  }

  .show-more {
    width: calc(100% - 1.5em);
    box-sizing: border-box;
    margin-left: 1.5em;
  }
}
</style>
