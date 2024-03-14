<template>
  <component :is="component">
    <b-card-title><span v-html="fileFormat" /></b-card-title>
    <HrefActions isAsset :data="asset" :shown="shown" @show="show" :auth="auth" />
    <b-card-text class="mt-4" v-if="asset.description">
      <Description :description="asset.description" compact />
    </b-card-text>
    <Metadata class="mt-4" :data="asset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
  </component>
</template>

<script>
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import { mapState } from 'vuex';
import Description from './Description.vue';
import HrefActions from './HrefActions.vue';
import StacFieldsMixin from './StacFieldsMixin';
import AuthUtils from './auth/utils';

export default {
  name: 'Asset',
  components: {
    Description,
    HrefActions,
    Metadata: () => import('./Metadata.vue')
  },
  mixins: [
    StacFieldsMixin({ formatMediaType })
  ],
  props: {
    asset: {
      type: Object,
      required: true
    },
    context: {
      type: Object,
      default: null
    },
    hasAlternatives: {
      type: Boolean,
      default: false
    },
    shown: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      ignore: [
        // Asset fields that are handled directly
        'href',
        'title',
        'description',
        'type',
        'roles',
        // Don't show these complex lists of coordinates: https://github.com/radiantearth/stac-browser/issues/141
        'proj:bbox',
        'proj:geometry',
        // Don't show very specific options that can't be rendered nicely
        'table:storage_options',
        'xarray:open_kwargs',
        'xarray:storage_options',
        // Special handling for auth
        'auth:refs',
        // Alternative Assets are displayed separately
        'alternate',
        'name'
      ]
    };
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'useTileLayerAsFallback']),
    component() {
      return this.hasAlternatives ? 'div' : 'b-card-body';
    },
    tileRendererType() {
      if (this.buildTileUrlTemplate && !this.useTileLayerAsFallback) {
        return 'server';
      }
      else {
        return 'client';
      }
    },
    fileFormat() {
      if (typeof this.asset.type === "string" && this.asset.type.length > 0) {
        return this.formatMediaType(this.asset.type);
      }
      return null;
    },
    auth() {
      return AuthUtils.resolveAuth(this.asset, this.context);
    }
  },
  methods: {
    show() {
      this.$emit('show', ...arguments);
    }
  }
};
</script>
