<template>
  <b-row>
    <b-col md="12">
      <Share class="float-right" :title="title" :stacUrl="url" :stacVersion="stacVersion" />
      <h1>
        <template v-if="icon">
          <img :src="icon.href" :alt="icon.title" :title="icon.title" class="icon mr-2" />
        </template>
        <span class="title">{{ title }}</span>
      </h1>
      <p class="lead" v-if="url || isSearchPage()">
        <span class="in mr-3" v-if="containerLink">in <StacLink :data="containerLink" /></span>
        <b-button-group>
          <b-button v-if="parentLink" :to="toBrowserPath(parentLink.href)" :title="`Go to parent > ${parentLink.title}`" variant="outline-primary" size="sm">
            <b-icon-arrow-90deg-up /> <span class="button-label prio">Go to Parent</span>
          </b-button>
          <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink.href)" :title="`Go to collection > ${collectionLink.title}`" variant="outline-primary" size="sm">
            <b-icon-folder-symlink /> <span class="button-label prio">Go to Collection</span>
          </b-button>
          <b-button variant="outline-primary" size="sm" v-b-toggle.sidebar title="Browse">
            <b-icon-book /> <span class="button-label prio">Browse</span>
          </b-button>
          <b-button v-if="supportsSearch && !isSearchPage()" variant="outline-primary" size="sm" :to="searchBrowserLink" title="Search">
            <b-icon-search /> <span class="button-label prio">Search</span>
          </b-button>
        </b-button-group>
      </p>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import StacLink from './StacLink.vue';
import { BIconArrow90degUp, BIconBook, BIconFolderSymlink, BIconSearch } from "bootstrap-vue";
import STAC from '../stac';
import Utils from '../utils';

export default {
  name: 'StacHeader',
  components: {
    BIconArrow90degUp,
    BIconBook,
    BIconFolderSymlink,
    BIconSearch,
    StacLink,
    Share: () => import('../components/Share.vue')
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'catalogUrl', 'data', 'url', 'title']),
    ...mapGetters(['root', 'parentLink', 'collectionLink', 'stacVersion', 'supportsSearch', 'toBrowserPath']),
    icon() {
      if (this.data instanceof STAC) {
        let icons = this.data.getIcons();
        if (icons.length > 0) {
          return icons[0];
        }
      }
      return null;
    },
    searchBrowserLink() {
      if (!this.allowSelectCatalog) {
        return '/search';
      }
      else if (this.supportsSearch && this.root) {
        return `/search${this.root.getBrowserPath()}`;
      }
      else if (this.supportsSearch && this.url) {
        return `/search${this.toBrowserPath(this.url)}`;
      }
      else {
        return null;
      }
    },
    containerLink() {
      // Check two cases where this page is the root...
      if (this.catalogUrl && this.url === this.catalogUrl) {
        return null;
      }
      if (this.root) {
        if (Utils.equalUrl(this.root.getAbsoluteUrl(), this.url)) {
          return null;
        }
        else {
          return {
            href: this.root.getAbsoluteUrl(),
            rel: 'root',
            title: STAC.getDisplayTitle(this.root)
          };
        }
      }
      return this.collectionLink || this.parentLink;
    }
  },
  methods: {
    isSearchPage() {
      return this.$router.currentRoute.name === 'search';
    }
  }
}
</script>

<style lang="scss" scoped>
h1 {
  word-break: break-word;
}
</style>