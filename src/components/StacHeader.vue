<template>
  <b-row>
    <b-col md="10">
      <h1>{{ title }}</h1>
      <p class="lead">
        <span class="in" v-if="rootLink">in <StacLink :link="rootLink" /></span>
        <b-button variant="outline-primary" size="sm" v-b-toggle.sidebar><b-icon-search /> Browse</b-button>
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
import { BIconSearch } from "bootstrap-vue";

export default {
  name: 'StacHeader',
  components: {
    BIconSearch,
    StacLink,
    Share: () => import('../components/Share.vue')
  },
  computed: {
    ...mapState(['baseUrl', 'data', 'url', 'title']),
    ...mapGetters(['rootTitle', 'stacVersion']),
    rootLink() {
      if (this.url === this.baseUrl) {
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