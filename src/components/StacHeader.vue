<template>
  <b-row>
    <b-col md="12">
      <Share class="float-right" :title="title" :stacUrl="url" :stacVersion="stacVersion" />
      <h1>{{ title }}</h1>
      <p class="lead" v-if="url">
        <span class="in mr-3" v-if="containerLink">in <StacLink :link="containerLink" /></span>
        <b-button-group>
          <b-button v-if="parentLink" :to="toBrowserPath(parentLink.href)" :title="parentLink.title" variant="outline-primary" size="sm"><b-icon-arrow-90deg-up /> Go to Parent</b-button>
          <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink.href)" :title="collectionLink.title" variant="outline-primary" size="sm"><b-icon-folder-symlink /> Go to Collection</b-button>
          <b-button variant="outline-primary" size="sm" v-b-toggle.sidebar><b-icon-book /> Browse</b-button>
          <b-button v-if="supportsSearch" variant="outline-primary" size="sm" to="/search"><b-icon-search /> Search</b-button>
        </b-button-group>
      </p>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import StacLink from './StacLink.vue';
import { BIconArrow90degUp, BIconBook, BIconFolderSymlink, BIconSearch } from "bootstrap-vue";
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
    ...mapState(['catalogUrl', 'data', 'url', 'title']),
    ...mapGetters(['rootLink', 'parentLink', 'collectionLink', 'stacVersion', 'supportsSearch', 'fromBrowserPath', 'toBrowserPath']),
    containerLink() {
      // Check two cases where this page is the root...
      if (this.catalogUrl && this.url === this.catalogUrl) {
        return null;
      }
      if (this.rootLink && Utils.equalUrl(this.fromBrowserPath(this.rootLink.href), this.url)) {
        return null;
      }
      return this.rootLink || this.collectionLink || this.parentLink;
    }
  }
}
</script>

<style lang="scss" scoped>
h1 {
  word-break: break-word;
}
</style>