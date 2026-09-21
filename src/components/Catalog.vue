<template>
  <b-card no-body :class="classes" v-visible.400="load" :img-placement="isList ? 'end' : undefined">
    <div class="card-img-wrapper">
      <AuthImage v-if="hasImage" class="thumbnail" v-bind="thumbnail" lazy />
    </div>
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, catalog]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="fileFormats.length > 0 || hasDescription || isDeprecated" class="intro">
        <b-badge v-if="isDeprecated" variant="warning" class="me-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="me-1 mt-1 fileformat">{{ format }}</b-badge>
        {{ summarizeDescription }}
      </b-card-text>
      <Keywords v-if="showKeywordsInCatalogCards && keywords.length > 0" :keywords="keywords" variant="primary" />
      <b-card-text v-if="temporalExtent" class="datetime"><small v-html="temporalExtent" /></b-card-text>
    </b-card-body>
    <b-card-footer>
      <slot name="footer" :data="data" :source="catalog">
        <StacActions v-if="data && !hideActions" :data="data" variant="outline-primary" compact size="sm" />
      </slot>
    </b-card-footer>
  </b-card>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import FileFormatsMixin from './FileFormatsMixin';
import StacFieldsMixin from './StacFieldsMixin';
import CardMixin from './CardMixin';
import StacLink from './StacLink.vue';
import StacActions from './StacActions.vue';
import { STAC } from 'stac-js';
import { formatTemporalExtent } from '@radiantearth/stac-fields/formatters';
import { BCard, BCardBody, BCardFooter, BCardText, BCardTitle } from 'bootstrap-vue-next';
import AuthImage from './AuthImage.vue';
import { getTemporalExtentFormatOptions } from '../utils';

export default {
  name: 'Catalog',
  components: {
    AuthImage,
    BCard,
    BCardBody,
    BCardFooter,
    BCardText,
    BCardTitle,
    StacLink,
    StacActions,
    Keywords: defineAsyncComponent(() => import('./Keywords.vue'))
  },
  mixins: [
    FileFormatsMixin,
    CardMixin,
    StacFieldsMixin({ formatTemporalExtent })
  ],
  props: {
    catalog: {
      type: Object,
      required: true
    },
    // Hides the default StacActions in the footer slot, for embeddings
    // where showing them would be redundant or confusing (e.g. the parent
    // collection preview shown alongside an item's own actions).
    hideActions: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState(['omitTimeForMidnight', 'showKeywordsInCatalogCards']),
    ...mapGetters(['getStac']),
    classes() {
      let classes = ['catalog-card'];
      if (!this.data) {
        classes.push('queued');
      }
      if (this.data && this.data.deprecated) {
        classes.push('deprecated');
      }
      if (this.hasImage) {
        classes.push('has-thumbnail');
      }
      return classes;
    },
    data() {
      return this.getStac(this.catalog);
    },
    temporalExtent() {
      if (this.data?.isCollection && this.data.extent?.temporal?.interval.length > 0) {
        const extent = this.data.extent.temporal.interval[0];
        if (Array.isArray(extent) && (typeof extent[0] === 'string' || typeof extent[1] === 'string')) {
          return this.formatTemporalExtent(extent, true, getTemporalExtentFormatOptions(extent, this.omitTimeForMidnight));
        }
      }
      return null;
    }
  },
  methods: {
    load(visible) {
      if (this.catalog instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.catalog.getAbsoluteUrl());
    }
  }
};
</script>
