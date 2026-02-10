<template>
  <b-card no-body class="item-card" :class="classes" v-b-visible.400="load">
    <div class="card-img-wrapper">
      <b-card-img-lazy v-if="hasImage" class="thumbnail" offset="200" v-bind="thumbnail" />
    </div>
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, item]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="fileFormats.length > 0 || hasDescription || isDeprecated" class="intro">
        <b-badge v-if="isDeprecated" variant="warning" class="mr-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="mr-1 mt-1 fileformat">{{ format }}</b-badge>
        <template v-if="hasDescription">{{ summarizeDescription }}</template>
      </b-card-text>
      <Keywords v-if="showKeywordsInItemCards && keywords.length > 0" :keywords="keywords" variant="primary" />
      <b-card-text>
        <small class="text-muted">
          <template v-if="extent">{{ extent | formatTemporalExtent }}</template>
          <template v-else-if="data && data.properties.datetime">{{ data.properties.datetime | formatTimestamp }}</template>
          <template v-else>{{ $t('items.noTime') }}</template>
        </small>
      </b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import FileFormatsMixin from './FileFormatsMixin';
import CardMixin from './CardMixin';
import StacLink from './StacLink.vue';
import { STAC } from 'stac-js';
import { formatTemporalExtent, formatTimestamp } from '@radiantearth/stac-fields/formatters';

export default {
  name: 'Item',
  components: {
    StacLink,
    Keywords: () => import('./Keywords.vue')
  },
  filters: {
    formatTemporalExtent,
    formatTimestamp
  },
  mixins: [
    FileFormatsMixin,
    CardMixin
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
    classes() {
      return {
        queued: !this.data,
        deprecated: this.isDeprecated,
        description: this.hasDescription
      };
    },
    extent() {
      if (this.data && (this.data.properties.start_datetime || this.data.properties.end_datetime)) {
        return [this.data.properties.start_datetime, this.data.properties.end_datetime];
      }
      return null;
    },
  },
  methods: {
    load(visible) {
      if (this.item instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.item.getAbsoluteUrl());
    }
  }
};
</script>
