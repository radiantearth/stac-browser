<template>
  <b-card no-body class="catalog-card" :class="{queued: !this.data}" v-b-visible.200="load">
    <b-card-img v-if="thumbnail && showThumbnail" class="thumbnail" :src="thumbnail.href" :alt="thumbnail.title" fluid></b-card-img>
    <b-card-body>
      <b-card-title>
        <StacLink :link="catalog" :title="title" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="data && data.description" class="intro">
        {{ data.description | stripCommonmark }}
      </b-card-text>
      <b-card-text v-if="temporalExtent"><small class="text-muted">{{ temporalExtent | shortTemporalExtent }}</small></b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
import StacLink from './StacLink.vue';
import STAC from '../stac';
import removeMd from 'remove-markdown';
import { Formatters } from '@radiantearth/stac-fields';

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
  data() {
    return {
      showThumbnail: false // Lazy load thumbnails and not all at once for API Collections
    }
  },
  filters: {
    stripCommonmark(text) {
      // Best-effort approach to remove some CommonMark (Markdown).
      // Likely not perfect, but seems good enough for most cases.
      return removeMd(text);
    },
    shortTemporalExtent(value) {
      return Formatters.formatTemporalExtent(value, true);
    }
  },
  computed: {
    ...mapGetters(['getStac']),
    data() {
      if (this.catalog instanceof STAC) {
        return this.catalog;
      }
      else {
        return this.getStac(this.catalog.href);
      }
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
      if (this.data?.isCollection() && this.data.extent?.temporal?.interval.length > 0) {
        let extent = this.data.extent.temporal.interval[0];
        if (extent[0] || extent[1]) {
          return this.data.extent.temporal.interval[0];
        }
      }
      return null;
    }
  },
  methods: {
    load(visible) {
      if (visible) {
        this.showThumbnail = true;
      }
      if (this.catalog instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.catalog.href);
    }
  }
}
</script>

<style lang="scss">
.catalog-card {
  box-sizing: border-box;
  margin-top: 0.5em;
  margin-bottom: 0.5em;

  &.queued {
    min-height: 10rem;
  }

  .intro {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card-img {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 200px;
  }
}
</style>