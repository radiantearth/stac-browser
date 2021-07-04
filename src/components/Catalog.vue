<template>
  <b-card no-body class="catalog-card" v-b-visible.once.200="load">
    <b-row no-gutters>
      <b-col :md="thumbnail ? 8 : 12">
        <b-card-body>
          <b-card-title>
            <StacLink :link="catalog" :title="title" class="stretched-link" />
          </b-card-title>
          <b-card-text v-if="data && data.description" class="intro">
            {{ data.description }}
          </b-card-text>
          <b-card-text v-if="temporalExtent"><small class="text-muted">{{ temporalExtent | TemporalExtent }}</small></b-card-text>
        </b-card-body>
      </b-col>
      <b-col md="4" v-if="thumbnail" class="thumbnail">
        <b-card-img :src="thumbnail.href" :alt="thumbnail.title" fluid></b-card-img>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
import StacLink from './StacLink.vue';

export default {
  name: 'Catalog',
  components: {
    StacLink
  },
  props: {
    catalog: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters(['getStac']),
    data() {
      return this.getStac(this.catalog.href);
    },
    thumbnail() {
      if (this.data) {
        let thumbnails = this.data.getThumbnails(true, 'thumbnail');
        if (thumbnails.length > 0) {
          return thumbnails[0];
        }
      }
      return null;
    },
    title() {
      if (this.data) {
        return this.data.title || this.data.id;
      }
      return null;
    },
    temporalExtent() {
      if (this.data && this.data.isCollection() && this.data.extent.temporal.interval.length > 0) {
        return this.data.extent.temporal.interval[0];
      }
      return null;
    }
  },
  methods: {
    load(visible) {
      if (visible) {
        this.$store.dispatch("load", { url: this.catalog.href });
      }
    }
  }
}
</script>

<style lang="scss">
.catalog-card {
  max-height: 12em;
  min-width: 50%;
  box-sizing: border-box;
  margin-top: 1em;

  .intro {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .row {
    height: 100%;
  }
  .thumbnail {
    text-align: center;
    height: 100%;
  }
  .card-img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
  }
}
</style>