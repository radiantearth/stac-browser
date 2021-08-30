<template>
  <b-card class="item-card" :class="{queued: !this.data}" v-bind="cardProps" img-top v-b-visible.200="load">
    <b-card-title>
      <StacLink :link="item" :title="title" class="stretched-link" />
    </b-card-title>
    <b-card-text><small class="text-muted">
      <template v-if="extent">{{ extent | TemporalExtent }}</template>
      <template v-else-if="data && data.properties.datetime">{{ data.properties.datetime | Timestamp }}</template>
      <template v-else>No time given</template>
    </small></b-card-text>
    <b-card-text v-if="fileFormats.length > 0">
      <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="mr-1 mt-1">{{ format | MediaType }}</b-badge>
    </b-card-text>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
import StacLink from './StacLink.vue';
import STAC from '../stac';

export default {
  name: 'Item',
  components: {
    StacLink
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    selected: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      showThumbnail: false
    }
  },
  computed: {
    ...mapGetters(['getStac']),
    cardProps() {
      let props = {};
      // Lazy load thumbnails and not all at once for API Collections
      if (this.showThumbnail && this.thumbnail) {
        props['img-src'] = this.thumbnail.href;
        props['img-alt'] = this.thumbnail.title;
      }
      if (Array.isArray(this.selected) && this.selected.find(obj => this.data.equals(obj))) {
        props['border-variant'] = 'danger';
      }
      return props;
    },
    data() {
      if (this.item instanceof STAC) {
        return this.item;
      }
      else {
        return this.getStac(this.item.href);
      }
    },
    thumbnail() {
      if (this.data) {
        let thumbnails = this.data.getThumbnails(true, 'thumbnail');
        if (thumbnails.length > 0) {
          return thumbnails[0];
        }
      }
      return {
        href: null,
        title: ''
      };
    },
    title() {
      if (this.data) {
        return this.data.properties.title || this.data.id;
      }
      return null;
    },
    extent() {
      if (this.data && (this.data.properties.start_datetime || this.data.properties.end_datetime)) {
        return [this.data.properties.start_datetime, this.data.properties.end_datetime];
      }
      return null;
    },
    fileFormats() {
      if (!this.data) {
        return [];
      }
      return Object.values(this.data.assets)
        .filter(asset => Array.isArray(asset.roles) && asset.roles.includes('data') && typeof asset.type === 'string') // Look for data files
        .map(asset => asset.type) // Array shall only contain media types
        .filter((v, i, a) => a.indexOf(v) === i); // Unique values
    }
  },
  methods: {
    load(visible) {
      if (visible) {
        this.showThumbnail = true;
      }
      if (this.item instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.item.href);
    }
  }
}
</script>

<style lang="scss">
.item-card {
  text-align: center;

  &.queued {
    min-height: 200px;
  }

  .card-img-top {
    width: auto;
    max-width: 100%;
    max-height: 200px;
  }
}
</style>