<template>
  <b-card no-body :class="classes" v-visible.400="load" :img-placement="isList ? 'end' : undefined">
    <b-card-img v-if="hasImage" class="thumbnail" v-bind="thumbnail" lazy />
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, catalog]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="data && (fileFormats.length > 0 || data.description || data.deprecated)" class="intro">
        <b-badge v-if="data.deprecated" variant="warning" class="me-1 mt-1 deprecated">{{ $t('deprecated') }}</b-badge>
        <b-badge v-for="format in fileFormats" :key="format" variant="secondary" class="me-1 mt-1 fileformat">{{ formatMediaType(format) }}</b-badge>
        {{ summarizeDescription(data.description) }}
      </b-card-text>
      <Keywords v-if="showKeywordsInCatalogCards && keywords.length > 0" :keywords="keywords" variant="primary" :center="!isList" />
      <b-card-text v-if="temporalExtent" class="datetime"><small v-html="temporalExtent" /></b-card-text>
    </b-card-body>
    <b-card-footer>
      <slot name="footer" :data="data" />
    </b-card-footer>
  </b-card>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import FileFormatsMixin from './FileFormatsMixin';
import StacFieldsMixin from './StacFieldsMixin';
import ThumbnailCardMixin from './ThumbnailCardMixin';
import StacLink from './StacLink.vue';
import { STAC } from 'stac-js';
import { formatMediaType, formatTemporalExtent } from '@radiantearth/stac-fields/formatters';
import Utils from '../utils';
import { BCard, BCardBody, BCardFooter, BCardImg, BCardText, BCardTitle } from 'bootstrap-vue-next';

export default {
  name: 'Catalog',
  components: {
    BCard,
    BCardBody,
    BCardFooter,
    BCardImg,
    BCardText,
    BCardTitle,
    StacLink,
    Keywords: defineAsyncComponent(() => import('./Keywords.vue'))
  },
  mixins: [
    FileFormatsMixin,
    ThumbnailCardMixin,
    StacFieldsMixin({ formatTemporalExtent })
  ],
  props: {
    catalog: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState(['showKeywordsInCatalogCards']),
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
      if (this.temporalExtent) {
        classes.push('has-extent');
      }
      return classes;
    },
    data() {
      return this.getStac(this.catalog);
    },
    temporalExtent() {
      if (this.data?.isCollection() && this.data.extent?.temporal?.interval.length > 0) {
        let extent = this.data.extent.temporal.interval[0];
        if (Array.isArray(extent) && (typeof extent[0] === 'string' || typeof extent[1] === 'string')) {
          return this.formatTemporalExtent(this.data.extent.temporal.interval[0], true);
        }
      }
      return null;
    },
    keywords() {
      if (this.data) {
        return this.data.getMetadata('keywords') || [];
      }
      return [];
    }
  },
  methods: {
    load(visible) {
      if (this.catalog instanceof STAC) {
        return;
      }
      this.$store.commit(visible ? 'queue' : 'unqueue', this.catalog.getAbsoluteUrl());
    },
    summarizeDescription(text) {
      return Utils.summarizeMd(text, 300);
    },
    formatMediaType(value) {
      return formatMediaType(value, null, {shorten: true});
    }
  }
};
</script>

<style lang="scss">
@import 'bootstrap/scss/mixins';
@import '../theme/variables.scss';

#stac-browser {
  .catalog-card {
    &.deprecated {
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }

    .card-body, .card-footer {
      position: relative;
    }
    .card-footer:empty {
      display: none;
    }
    
    /* Card image base styling */
    .card-img-top,
    .card-img-end,
    .card-img-start {
      object-fit: contain;
      object-position: center;
    }
    
    .intro {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      overflow-wrap: anywhere;
      text-align: left;
    }
    &.has-extent {
      .intro {
        margin-bottom: 0.5rem;
      }
    }
    .datetime {
      color: $secondary;
    }
    .badge.deprecated {
      text-transform: uppercase;
    }
  }
  .card-list {
    .catalog-card {
      box-sizing: border-box;
      margin: 0.5em 0;
      display: flex;

      .card-img-end {
        min-height: 100px;
        height: 100%;
        max-height: 8.5rem;
        max-width: 33%;
        object-fit: contain;
        object-position: center right;
      }
      .card-footer {
        min-width: 175px;
        max-width: 175px;
        border-top: 0;
      }
      .intro {
        -webkit-line-clamp: 2;
        line-clamp: 2;
      }
    }
  }
  .card-columns {
    .catalog-card {
      box-sizing: border-box;
      margin-top: 0.5em 0;
      text-align: center;

      &.queued {
        min-height: 10rem;
      }
      .card-img-top {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 300px;
        object-fit: contain;
        object-position: center;
      }
      .card-title {
        text-align: center;
      }
    }
  }
}
</style>
