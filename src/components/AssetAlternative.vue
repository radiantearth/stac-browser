<template>
  <div class="asset-alternative">
    <h4 class="mb-4" v-html="fileFormat" />
    <HrefActions isAsset :data="asset" :shown="shown" @show="show" :auth="auth" />
    <div class="mt-4" v-if="asset.description">
      <Description :description="asset.description" compact />
    </div>
    <MetadataGroups class="mt-4" :data="resolvedAsset" :ignoreFields="ignoredMetadataFields" title="" type="Asset" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import Description from './Description.vue';
import HrefActions from './HrefActions.vue';
import StacFieldsMixin from './StacFieldsMixin';
import AuthUtils from './auth/utils';
import { isObject, size } from 'stac-js/src/utils.js';
import { Asset, STACReference } from 'stac-js';
import { getIgnoredFields } from '../ignored-metadata.js';

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
  computed: {
    ignoredMetadataFields() {
      return getIgnoredFields(this.asset);
    },
    resolvedAsset() {
      if (Array.isArray(this.asset['storage:refs'])) {
        const asset = new Asset(this.asset);
        asset['storage:schemes'] = this.resolveStorage(this.asset);
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
      return AuthUtils.resolveAuth(this.asset);
    }
  },
  methods: {
    resolveStorage(obj) {
      if (obj instanceof STACReference) {
        const refs = obj.getMetadata('storage:refs');
        const schemes = obj.getMetadata('storage:schemes');
        if (size(refs) > 0 && size(schemes) > 0) {
          return refs
            .map(ref => schemes[ref])
            .filter(ref => isObject(ref));
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

<style lang="scss" scoped>
.asset-alternative {
  padding: 1rem;
}
</style>
