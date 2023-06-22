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
        <b-button-group class="actions" v-if="href">
          <CopyButton v-if="!isBrowserProtocol" variant="primary" :copyText="href">
            {{ buttonText }}
          </CopyButton>
          <b-button v-else :href="href" target="_blank" variant="primary">
            <b-icon-box-arrow-up-right v-if="browserCanOpenFile" /> 
            <b-icon-download v-else />
            {{ buttonText }}
          </b-button>
          <b-button v-if="canShow && !shown" @click="show" variant="primary">
            <b-icon-eye />&nbsp;
            <template v-if="isThumbnail">{{ $t('assets.showThumbnail') }}</template>
            <template v-else>{{ $t('assets.showOnMap') }}</template>
          </b-button>
        </b-button-group>
        <b-card-text class="mt-4" v-if="asset.description">
          <Description :description="asset.description" compact />
        </b-card-text>
        <Metadata class="mt-4" :data="asset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconBoxArrowUpRight, BIconCheck, BIconChevronRight, BIconChevronDown, BIconDownload, BIconEye } from 'bootstrap-vue';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import { mapGetters, mapState } from 'vuex';
import Description from './Description.vue';
import STAC from '../models/stac';
import Utils, { browserProtocols, imageMediaTypes, mapMediaTypes } from '../utils';
import StacFieldsMixin from './StacFieldsMixin';

export default {
  name: 'Asset',
  components: {
    BCollapse,
    BIconBoxArrowUpRight,
    BIconCheck,
    BIconChevronDown,
    BIconChevronRight,
    BIconDownload,
    BIconEye,
    CopyButton: () => import('./CopyButton.vue'),
    Description,
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
    ...mapGetters(['getRequestUrl']),
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
    isThumbnail() {
      return Array.isArray(this.asset.roles) && this.asset.roles.includes('thumbnail');
    },
    canShow() {
      // We need to know the type, otherwise we don't even try to show it
      if (typeof this.asset.type !== 'string') {
        return false;
      }
      // If the tile renderer is a tile server, we can't really know what it supports so we pass all images
      else if (this.tileRendererType === 'server' && imageMediaTypes.includes(this.asset.type)) {
        return true;
      }
      // Don't pass GDAL VFS URIs to client-side tile renderer: https://github.com/radiantearth/stac-browser/issues/116
      else if (this.isGdalVfs && this.tileRendererType === 'client') {
        return false;
      }
      // Only http(s) links and relative links are supported
      else if (!this.isBrowserProtocol) {
        return false;
      }
      // Otherwise, all images that a browser can read are supported + JSON
      else if (mapMediaTypes.includes(this.asset.type)) {
        return true;
      }
      return false;
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
    },
    protocol() {
      if (typeof this.href === 'string') {
        if (this.href) {
          let match = this.href.match(/^(\w+):\/\//);
          if (match) {
            return match[1].toLowerCase();
          }
        }
      }
      return null;
    },
    isBrowserProtocol() {
      return (!this.protocol && !this.isGdalVfs) || browserProtocols.includes(this.protocol);
    },
    isGdalVfs() {
      return Utils.isGdalVfsUri(this.asset.href);
    },
    href() {
      if (typeof this.asset.href !== 'string') {
        return null;
      }
      let baseUrl = null;
      if (this.context instanceof STAC) {
        baseUrl = this.context.getAbsoluteUrl();
      }
      return this.getRequestUrl(this.asset.href, baseUrl);
    },
    from() {
      if (this.isGdalVfs) {
        let type = this.asset.href.match(/^\/vsi([a-z\d]+)(_streaming)?\//);
        return this.protocolName(type);
      }
      else {
        return this.protocolName(this.protocol);
      }
    },
    browserCanOpenFile() {
      if (this.isGdalVfs)  {
        return false;
      }
      if (Utils.canBrowserDisplayImage(this.asset)) {
        return true;
      }
      else if (typeof this.asset.type === 'string') {
        switch(this.asset.type.toLowerCase()) {
          case 'text/html':
          case 'application/xhtml+xml':
          case 'text/plain':
          case 'application/pdf':
            return true;
        }
      }
      return false;
    },
    buttonText() {
      if (this.browserCanOpenFile && this.isBrowserProtocol) {
        return this.$t('open');
      }
      let what = 'download';
      if (this.isGdalVfs) {
        what = 'copyGdalVfsUrl';
      }
      else if (!this.isBrowserProtocol) {
        what = 'copyUrl';
      }
      let where = (!this.isBrowserProtocol && this.from) ? 'withSource' : 'generic';
      return this.$t(`assets.${what}.${where}`, {source: this.from});
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
      let asset = Object.assign({}, this.asset);
      // Override asset href with absolute URL if not a GDAL VFS
      if (!this.isGdalVfs) {
        asset.href = this.href;
      }
      this.$emit('show', asset, this.id, this.isThumbnail);
    },
    protocolName(protocol) {
      if (typeof protocol !== 'string') {
        return '';
      }
      switch(protocol.toLowerCase()) {
        case 's3':
          return this.$t('protocol.s3');
        case 'abfs':
        case 'abfss':
          return this.$t('protocol.azure');
        case 'gcs':
          return this.$t('protocol.gcs');
        case 'ftp':
          return this.$t('protocol.ftp');
        case 'oss':
          return this.$t('protocol.oss');
        case 'file':
          return this.$t('protocol.file');
      }
      return '';
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