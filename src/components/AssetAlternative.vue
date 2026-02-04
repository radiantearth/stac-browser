<template>
  <div>
    <h4 class="mb-4" v-html="fileFormat" />
    <HrefActions isAsset :data="asset" :shown="shown" @show="show" :auth="auth" />
    <div class="mt-4" v-if="asset.description">
      <Description :description="asset.description" compact />
    </div>
    <MetadataGroups class="mt-4" :data="resolvedAsset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import Description from './Description.vue';
import HrefActions from './HrefActions.vue';
import StacFieldsMixin from './StacFieldsMixin';
import AuthUtils from './auth/utils';
import Utils from '../utils';
import { Asset, STACObject } from 'stac-js';

export default {
  name: 'AssetAlternative',
  components: {
    Description,
    HrefActions,
    MetadataGroups: defineAsyncComponent(() => import('./MetadataGroups.vue'))
  },
  mixins: [
    StacFieldsMixin({ formatMediaType })
  ],
  props: {
    asset: {
      type: Object,
      required: true
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
  emits: ['show'],
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
    context() {
      return this.asset.getContext();
    },
    resolvedAsset() {
      if (Array.isArray(this.asset['storage:refs'])) {
        const asset = new Asset(this.asset, this.asset.getKey(), this.context);
        asset['storage:schemes'] = this.resolveStorage(this.asset, this.context);
        return asset;
      }
      return this.asset;
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
      if (context instanceof STACObject && Utils.size(obj['storage:refs']) > 0) {
        const schemes = context.getMetadata('storage:schemes');
        const filteredSchemes = {};
        for (const ref of obj['storage:refs']) {
          if (Utils.isObject(schemes[ref])) {
            filteredSchemes[ref] = schemes[ref];
          }
        }
        return filteredSchemes;
      }
      return [];
    },
    show() {
      this.$emit('show', ...arguments);
    }
  }
};
</script>
