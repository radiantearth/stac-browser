<template>
  <b-row>
    <b-col md="10">
      <h1>{{ title }}</h1>
      <p class="lead">
        <span class="in" v-if="rootLink">in <StacLink :link="rootLink" /></span>
        <b-button-group>
          <b-button v-if="parentLink" variant="outline-primary" size="sm"><b-icon-arrow-90deg-up /> Go to Parent</b-button>
          <b-button v-if="collectionLink" variant="outline-primary" size="sm"><b-icon-folder-symlink /> Go to Collection</b-button>
          <b-button variant="outline-primary" size="sm" v-b-toggle.sidebar><b-icon-book /> Browse</b-button>
          <b-button v-if="supportsSearch" variant="outline-primary" size="sm" to="/search"><b-icon-search /> Search</b-button>
        </b-button-group>
      </p>
    </b-col>
    <b-col md="2" class="text-sm-right">
      <Share :title="title" :stacUrl="url" :stacVersion="stacVersion" />
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import StacLink from './StacLink.vue';
import { BIconArrow90degUp, BIconBook, BIconFolderSymlink, BIconSearch } from "bootstrap-vue";

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
    ...mapGetters(['rootTitle', 'stacVersion', 'supportsSearch']),
    parentLink() {
      return null; // ToDo
    },
    collectionLink() {
      return null; // ToDo
    },
    rootLink() {
      if (this.url === this.catalogUrl) {
        return null;
      }
      return {
        href: '/',
        title: this.rootTitle
      };
    }
  }
}
</script>

<style lang="scss" scoped>
.lead .in {
  margin-right: 0.5em;
}
</style>