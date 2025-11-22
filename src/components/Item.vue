<template>
  <b-card no-body class="item-card" :class="classes" v-visible.400="load">
    <div class="card-img-wrapper">
      <b-card-img v-if="hasImage" class="thumbnail" v-bind="thumbnail" lazy />
    </div>
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, item]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="fileFormats.length > 0 || hasDescription || isDeprecated" class="intro">
        <b-badge v-if="isDeprecated" variant="warning" class="me-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="me-1 mt-1 fileformat">{{ formatMediaType(format) }}</b-badge>
        <template v-if="hasDescription">{{ summarizeDescription }}</template>
      </b-card-text>
      <Keywords v-if="showKeywordsInItemCards && keywords.length > 0" :keywords="keywords" variant="primary" />
      <b-card-text><small class="datetime" v-html="displayTime" /></b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';

import FileFormatsMixin from './FileFormatsMixin';
import CardMixin from './CardMixin';
import StacLink from './StacLink.vue';
import { STAC } from 'stac-js';
import { formatTemporalExtent, formatTimestamp, formatMediaType } from '@radiantearth/stac-fields/formatters';
import Registry from '@radiantearth/stac-fields/registry';
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
        description: this.hasDescription,
        'has-extent': true
      };
    },
    extent() {
      if (this.data && (this.data.properties.start_datetime || this.data.properties.end_datetime)) {
        return [this.data.properties.start_datetime, this.data.properties.end_datetime];
      }
      return null;
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
