<template>
  <ul class="tree" v-visible="load">
    <li>    
      <b-button v-if="pagination" size="sm" variant="light" disabled>
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
      
      --><b-button size="sm" variant="light" :class="{path: onPath || active}" :disabled="!to && !active" :to="to" @click="onClick" :title="tooltip">
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
          <Tree v-for="(child, i) in shownChilds" :key="i" :item="child" :parent="stac" :path="path" :searchTerm="searchTerm" :selectedKeywords="selectedKeywords" />
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
import { getDisplayTitle, Collection } from '../models/stac';
import { STAC } from 'stac-js';
import Utils from '../utils';

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
    },
    searchTerm: {
      type: String,
      default: ''
    },
    selectedKeywords: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:keywords'],
  data() {
    return {
      expanded: false,
      loading: false,
      chunk: 1,
      childs: []
    };
  },
  computed: {
    ...mapState(['data', 'apiCatalogPriority']),
    ...mapGetters(['getStac']),
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
      else if (this.item instanceof STAC) {
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
          return this.parent.getBrowserPath();
        }
        else {
          return null;
        }
      }
      else if (this.stac instanceof STAC) {
        return this.stac.getBrowserPath();
      }
      return null;
    },
    title() {
      if (this.pagination) {
        return this.$t('tree.moreCollectionPagesAvailable');
      }
      return getDisplayTitle([this.item, this.stac]);
    },
    tooltip() {
      const keywords = this.stac?.keywords;
      if (Array.isArray(keywords) && keywords.length > 0) {
        return keywords.join(', ');
      }
      return null;
    },
    allKeywords() {
      if (this.parent) {
        return [];
      }
      const keywords = [];
      for (const child of this.childs) {
        const childStac = this.resolveChildStac(child);
        if (childStac && Array.isArray(childStac.keywords)) {
          for (const kw of childStac.keywords) {
            if (!keywords.includes(kw)) {
              keywords.push(kw);
            }
          }
        }
      }
      return keywords.sort();
    },
    filteredChilds() {
      if (!this.searchTerm && !this.selectedKeywords.length) {
        return this.childs;
      }
      return this.childs.filter(child => {
        const childStac = this.resolveChildStac(child);
        if (this.selectedKeywords.length > 0) {
          if (!childStac || !Array.isArray(childStac.keywords)) {
            return false;
          }
          if (!this.selectedKeywords.every(kw => childStac.keywords.includes(kw))) {
            return false;
          }
        }
        if (this.searchTerm) {
          const title = getDisplayTitle([child, childStac]);
          const keywords = childStac?.keywords || [];
          return Utils.search(this.searchTerm, [title, ...keywords]);
        }
        return true;
      });
    },
    hasMore() {
      return this.filteredChilds.length > this.shownChilds.length;
    },
    shownChilds() {
      return this.filteredChilds.slice(0, this.chunk * 50);
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
    }
  },
  watch: {
    searchTerm(newTerm) {
      if (newTerm && !this.parent && this.stac) {
        for (const child of this.childs) {
          if (typeof child.href === 'string') {
            const absUrl = toAbsolute(child.href, this.stac.getAbsoluteUrl());
            if (!this.getStac(absUrl)) {
              this.$store.commit('queue', absUrl);
            }
          }
        }
      }
    },
    allKeywords(keywords) {
      this.$emit('update:keywords', keywords);
    },
    onPath: {
      immediate: true,
      handler() {
        if (this.onPath) {
          this.expanded = true;
        }
      }
    },
    stac: {
      immediate: true,
      handler(newStac, oldStac) {
        if (newStac instanceof Collection) {
          newStac.setApiDataListener('tree', () => this.updateChilds());
        }
        if (oldStac instanceof Collection) {
          oldStac.setApiDataListener('tree');
        }
        this.updateChilds();
      }
    }
  },
  created() {
    if (!this.parent) {
      this.expanded = true;
    }
  },
  methods: {
    resolveChildStac(child) {
      if (child instanceof STAC) {
        return child;
      }
      if (this.stac && typeof child.href === 'string') {
        return this.getStac(toAbsolute(child.href, this.stac.getAbsoluteUrl()));
      }
      return null;
    },
    updateChilds() {
      if (this.stac && this.stac.isCatalogLike) {
        this.childs = this.stac.getChildren(this.apiCatalogPriority);
      }
      else {
        this.childs = [];
      }
    },
    showMore() {
      this.chunk++;
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
