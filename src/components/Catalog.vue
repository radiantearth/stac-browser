<template>
  <b-card no-body :class="classes" v-b-visible.400="load" :img-right="isList">
    <b-card-img-lazy v-if="hasImage" class="thumbnail" offset="200" v-bind="thumbnail" @error.native="handleImgError" />
    <b-card-body>
      <b-card-title>
        <StacLink :data="[data, catalog]" class="stretched-link" />
      </b-card-title>
      <b-card-text v-if="data && (data.description || data.deprecated)" class="intro">
        <b-badge v-if="data.deprecated" variant="warning" class="deprecated">Deprecated</b-badge>
        {{ data.description | stripCommonmark }}
      </b-card-text>
      <b-card-text v-if="temporalExtent" class="datetime"><span v-html="temporalExtent" /></b-card-text>
    </b-card-body>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex';
import ThumbnailCardMixin from './ThumbnailCardMixin';
import StacLink from './StacLink.vue';
import STAC from '../models/stac';
import removeMd from 'remove-markdown';
import { formatTemporalExtent } from '@radiantearth/stac-fields/formatters';

export default {
  name: 'Catalog',
  components: {
    StacLink
  },
  filters: {
    stripCommonmark(text) {
      // Best-effort approach to remove some CommonMark (Markdown).
      // Likely not perfect, but seems good enough for most cases.
      return removeMd(text);
    }
  },
  mixins: [
    ThumbnailCardMixin
  ],
  props: {
    catalog: {
      type: Object,
      required: true
    }
  },
  computed: {
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
          return formatTemporalExtent(this.data.extent.temporal.interval[0], true);
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
      this.$store.commit(visible ? 'queue' : 'unqueue', this.catalog.href);
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser {
  .catalog-card {

    &.deprecated {
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }

    .intro {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-align: left;
    }
      
    .badge.deprecated {
      text-transform: uppercase;
    }
  }
  .card-list {
    flex-direction: row;

    .catalog-card {
      box-sizing: border-box;
      margin-top: 0.5em;
      margin-bottom: 0.5em;

      &.has-extent:not(.has-thumbnail) {
        padding-top: 0.75em;
      }

      .card-img-right {
        min-height: 100px;
        height: 100%;
        max-height: 8.5rem;
        max-width: 33%;
      }

      .intro {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-align: left;
        margin-bottom: 0;
      }
      .datetime {
        display: inline-block;
        padding: $border-radius;
        border: 0;
        background-color: rgba(0,0,0,0.6);
        color: map-get($theme-colors, "light");
        border-radius: 0 0 0 $border-radius;
        position: absolute;
        top: 0;
        right: 0;
        font-size: 80%;
      }
    }
  }
  .card-columns {
    .catalog-card {
      box-sizing: border-box;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
      text-align: center;

      &.queued {
        min-height: 10rem;
      }

      .card-img {
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: 300px;
      }
      .card-title {
        text-align: center;
      }
      .datetime {
        color: map-get($theme-colors, "secondary");
        font-size: 85%;
      }
    }
  }
}
</style>