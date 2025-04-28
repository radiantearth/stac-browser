<template>
  <component :is="component">
    <b-card-title><span v-html="fileFormat" /></b-card-title>
    <HrefActions isAsset :data="asset" :shown="shown" @show="show" :auth="auth" />
    <b-card-text class="mt-4" v-if="asset.description">
      <Description :description="asset.description" compact />
    </b-card-text>
    <Metadata class="mt-4" :data="resolvedAsset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
  </component>
</template>

<script>
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import { mapState } from 'vuex';
import Description from './Description.vue';
import HrefActions from './HrefActions.vue';
import StacFieldsMixin from './StacFieldsMixin';
import AuthUtils from './auth/utils';
import Utils from '../utils';
import STAC from '../models/stac';

export default {
  name: 'AssetAlternative',
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
        // Special handling for auth and storage
        'auth:refs',
        'storage:refs',
        // Alternative Assets are displayed separately
        'alternate',
        'alternate:name',
      ]
    };
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'useTileLayerAsFallback']),
    resolvedAsset() {
      if (Array.isArray(this.asset['storage:refs'])) {
        const storage = this.resolveStorage(this.asset, this.context);
        const asset = Object.assign({}, this.asset);
        asset['storage:schemes'] = storage;
        return asset;
      }
      return this.asset;
    },
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
    resolveStorage(obj, context) {
      if (context instanceof STAC && Utils.size(obj['storage:refs']) > 0) {
        const scheme = context.getMetadata('storage:schemes');
        if (Utils.size(scheme) > 0) {
          const schemes = {};
          for (const key in scheme) {
            const value = scheme[key];
            if (Utils.isObject(value)) {
              schemes[key] = value;
            }
          }
          return schemes;
        }
      }
      return [];
    },
    show() {
      this.$emit('show', ...arguments);
    }
  }
};
</script>
