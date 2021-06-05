<template>
  <State>
    <b-row>
      <b-col :md="isCollection ? 7 : 11">
        <h1>{{ title }}</h1>
      </b-col>
      <b-col :md="1">
        <Share :title="title" :stacUrl="url" :stacVersion="data.stac_version" />
      </b-col>
    </b-row>
    <b-row>
      <b-col :md="isCollection ? 8 : 12">
        <Description v-if="data.description" :description="data.description" />
        <Keywords v-if="Array.isArray(data.keywords) && data.keywords.length > 0" :keywords="data.keywords" />
      </b-col>
    </b-row>
  </State>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import Description from '../components/Description.vue';
import Keywords from '../components/Keywords.vue';
import State from '../components/State.vue';

export default {
  name: "Catalog",
  components: {
    Description,
    Keywords,
    State,
    Share: () => import('../components/Share.vue')
  },
  props: {
    path: {
      type: String,
      default: null
    }
  },
  created() {
    this.$store.dispatch('load', this.path);
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['isCollection']),
    title() {
      return this.data.title || this.data.id;
    },
  }
};
</script>
