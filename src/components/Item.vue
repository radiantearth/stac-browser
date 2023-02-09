<template>
  <b-card no-body class="item-card" :class="{queued: !data, deprecated: isDeprecated}" v-b-visible.400="load">
    <b-card-img-lazy v-if="hasImage" class="thumbnail" offset="200" v-bind="thumbnail" @error.native="handleImgError" />
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, item]" class="stretched-link" />
      </b-card-title>
      <b-card-text>
        <small class="text-muted">
          <template v-if="extent">{{ extent | formatTemporalExtent }}</template>
          <template v-else-if="data && data.properties.datetime">{{ data.properties.datetime | formatTimestamp }}</template>
          <template v-else>{{ $t('items.noTime') }}</template>
        </small>
      </b-card-text>
      <b-card-text v-if="fileFormats.length > 0 || isDeprecated">
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="mr-1 mt-1 fileformat">{{ format | formatMediaType }}</b-badge>
        <b-badge v-if="isDeprecated" variant="warning" class="mr-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
      </b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
import ThumbnailCardMixin from './ThumbnailCardMixin';
import StacLink from './StacLink.vue';
import STAC from '../models/stac';
import { formatTemporalExtent, formatTimestamp, formatMediaType } from '@radiantearth/stac-fields/formatters';

export default {
  name: 'Item',
  components: {
    StacLink
  },
  filters: {
    formatMediaType,
    formatTemporalExtent,
    formatTimestamp
  },
  mixins: [
    ThumbnailCardMixin
  ],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters(['getStac']),
    data() {
      return this.getStac(this.item);
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
    },
    isDeprecated() {
      return this.data instanceof STAC && Boolean(this.data.properties.deprecated);
    }
  },
  methods: {
    load(visible) {
      if (this.item instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.item.href);
    }
  }
};
</script>

<style lang="scss">
#stac-browser {
  .item-card {
    text-align: center;

    &.deprecated {
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }
    }

    &.queued {
      min-height: 200px;
    }

    .badge {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;

      &.deprecated {
        text-transform: uppercase;
      }
    }

    .card-img {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 200px;
    }
    .card-body {
      text-align: center;
    }
  }
}
</style>