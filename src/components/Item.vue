<template>
  <b-card no-body class="item-card" :class="{queued: !data, deprecated: isDeprecated, description: hasDescription}" v-visible.400="load">
    <b-card-img v-if="hasImage" v-bind="thumbnail" lazy />
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, item]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="fileFormats.length > 0 || hasDescription || isDeprecated" class="intro">
        <b-badge v-if="isDeprecated" variant="warning" class="me-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="me-1 mt-1 fileformat">{{ formatMediaType(format) }}</b-badge>
        <template v-if="hasDescription">{{ summarizeDescription }}</template>
      </b-card-text>
      <Keywords v-if="showKeywordsInItemCards && keywords.length > 0" :keywords="keywords" variant="primary" center />
      <b-card-text>
        <small class="text-muted">
          {{ displayTime }}
        </small>
      </b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';

import FileFormatsMixin from './FileFormatsMixin';
import ThumbnailCardMixin from './ThumbnailCardMixin';
import StacLink from './StacLink.vue';
import { STAC } from 'stac-js';
import { formatTemporalExtent, formatTimestamp, formatMediaType } from '@radiantearth/stac-fields/formatters';
import Registry from '@radiantearth/stac-fields/registry';
import Utils from '../utils';
import { BCard, BCardBody, BCardText, BCardTitle, BCardImg } from 'bootstrap-vue-next';
import contentType from 'content-type';

Registry.addDependency('content-type', contentType);

export default defineComponent({
  name: 'Item',
  components: {
    StacLink,
    BCard,
    BCardImg,
    BCardBody,
    BCardText,
    BCardTitle,
    Keywords: defineAsyncComponent(() => import('./Keywords.vue'))
  },
  mixins: [
    FileFormatsMixin,
    ThumbnailCardMixin
  ],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState(['showKeywordsInItemCards']),
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
    keywords() {
      if (this.data) {
        return this.data.getMetadata('keywords') || [];
      }
      return [];
    },
    isDeprecated() {
      return this.data instanceof STAC && Boolean(this.data.properties.deprecated);
    },
    hasDescription() {
      return this.data instanceof STAC && Utils.hasText(this.data.properties.description);
    },
    summarizeDescription() {
      return this.hasDescription ? Utils.summarizeMd(this.data.properties.description, 150) : '';
    },
    displayTime() {
      if (this.extent) {
        return formatTemporalExtent(this.extent);
      }
      else if (this.data && this.data.properties.datetime) {
        return formatTimestamp(this.data.properties.datetime);
      }
      else {
        return this.$t('items.noTime');
      }
    },
  },
  methods: {
    formatMediaType(value) {
      return formatMediaType(value, null, {shorten: true});
    },
    load(visible) {
      if (this.item instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.item.getAbsoluteUrl());
    }
  }
});
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

    /* Card image styling */
    .card-img-top {
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
      object-position: center;
    }

    .intro {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
      margin-bottom: 0.5rem;
    }

    &.description {
      .intro {
        text-align: left;
        margin-bottom: 0.5rem;
      }
    }

    .badge.deprecated {
      text-transform: uppercase;
    }

    .card-body {
      text-align: center;
      position: relative;
    }
  }
}
</style>
