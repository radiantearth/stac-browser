<template>
  <b-card class="asset expandable-card" no-body>
    <b-card-header header-tag="header" role="tab">
      <b-button block v-b-toggle="uid" variant="asset" squared>
        <span class="chevron" aria-hidden="true">
          <b-icon-chevron-down v-if="expanded" />
          <b-icon-chevron-right v-else />
        </span>
        <span class="title">{{ asset.title || id }}</span>
        <div class="badges ml-1" v-if="Array.isArray(asset.roles)">
          <b-badge v-if="shown" variant="success" class="shown" :title="$t('assets.currentlyShown')">
            <b-icon-check /> {{ $t('assets.shown') }}
          </b-badge>
          <b-badge v-if="asset.deprecated" variant="warning" class="deprecated">{{ $t('deprecated') }}</b-badge>
          <b-badge v-for="role in asset.roles" :key="role" :variant="role === 'data' ? 'primary' : 'secondary'" class="role">{{ displayRole(role) }}</b-badge>
          <b-badge v-if="shortFileFormat" variant="dark" class="format" :title="fileFormat"><span v-html="shortFileFormat" /></b-badge>
        </div>
      </b-button>
    </b-card-header>
    <b-collapse :id="uid" v-model="expanded" :accordion="type" role="tabpanel" @input="collapseToggled">
      <b-card-body>
        <b-card-title><span v-html="fileFormat" /></b-card-title>
        <HrefActions isAsset :data="asset" :shown="shown" @show="show" />
        <b-card-text class="mt-4" v-if="asset.description">
          <Description :description="asset.description" compact />
        </b-card-text>
        <Metadata class="mt-4" :data="asset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconCheck, BIconChevronRight, BIconChevronDown } from 'bootstrap-vue';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import { mapState } from 'vuex';
import Description from './Description.vue';
import HrefActions from './HrefActions.vue';
import StacFieldsMixin from './StacFieldsMixin';

export default {
  name: 'Asset',
  components: {
    BCollapse,
    BIconCheck,
    BIconChevronDown,
    BIconChevronRight,
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
    id: {
      type: String,
      required: true
    },
    context: {
      type: Object,
      default: null
    },
    definition: {
      type: Boolean,
      default: false
    },
    expand: {
      type: Boolean,
      default: null
    },
    shown: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      expanded: false,
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
        'xarray:storage_options'
      ]
    };
  },
  computed: {
    ...mapState(['buildTileUrlTemplate', 'useTileLayerAsFallback', 'url', 'stateQueryParameters']),
    tileRendererType() {
      if (this.buildTileUrlTemplate && !this.useTileLayerAsFallback) {
        return 'server';
      }
      else {
        return 'client';
      }
    },
    type() {
      return this.definition ? 'itemdef' : 'asset';
    },
    uid() {
      return `${this.type}-${this.id}`;
    },
    fileFormat() {
      if (typeof this.asset.type === "string" && this.asset.type.length > 0) {
        return this.formatMediaType(this.asset.type);
      }
      return null;
    },
    shortFileFormat() {
      if (typeof this.asset.type === "string" && this.asset.type.length > 0) {
        return this.formatMediaType(this.asset.type, null, {shorten: true});
      }
      return null;
    }
  },
  created() {
    if (this.stateQueryParameters[this.type].indexOf(this.uid) > -1) {
      this.expanded = true;
      return;
    }

    if (typeof this.expand === 'boolean') {
      this.expanded = this.expand;
    }
    else {
      this.expanded = false;
    }
  },
  methods: {
    displayRole(role) {
      let key = `assets.role.${role}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return role;
    },
    show() {
      this.$emit('show', ...arguments);
    },
    collapseToggled(isVisible) {
      let event = isVisible ? 'openCollapsible' : 'closeCollapsible';
      this.$store.commit(event, {type: this.type, uid: this.uid});
    }
  }
};
</script>

<style lang="scss">
#stac-browser .asset {
  .metadata {
    .card-columns {
      column-count: 1;
    }
    .card {
      border: 0;
    }
    .card-body {
      padding: 0;
    }
  }
}
</style>