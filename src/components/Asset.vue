<template>
  <b-card class="asset" no-body>
    <b-card-header header-tag="header" role="tab" class="p-0">
      <b-button block v-b-toggle="uid" variant="asset" squared class="p-2 d-flex">
        <span class="title">
          <span class="mr-1" aria-hidden="true">
            <b-icon-chevron-down v-if="expanded" />
            <b-icon-chevron-right v-else />
          </span>
          {{ asset.title || id }}
        </span>
        <div class="badges ml-1" v-if="Array.isArray(asset.roles)">
          <b-badge v-if="shown" variant="success" class="shown ml-1 mb-1" title="This is the asset currently shown">
            <b-icon-check /> shown
          </b-badge>
          <b-badge v-if="asset.deprecated" variant="warning" class="deprecated ml-1 mb-1">Deprecated</b-badge>
          <b-badge v-for="role in asset.roles" :key="role" :variant="role === 'data' ? 'primary' : 'secondary'" class="role ml-1 mb-1">{{ role }}</b-badge>
          <b-badge variant="dark" class="format ml-1 mb-1" :title="fileFormat">{{ shortFileFormat }}</b-badge>
        </div>
      </b-button>
    </b-card-header>
    <b-collapse :id="uid" v-model="expanded" accordion="assets" role="tabpanel">
      <b-card-body>
        <b-card-title>{{ fileFormat }}</b-card-title>
        <b-button-group class="actions" v-if="href">
          <CopyButton v-if="shouldCopy" variant="primary" :copyText="href">
            {{ buttonText }}
          </CopyButton>
          <b-button v-else :href="href" target="_blank" variant="primary">
            <b-icon-box-arrow-up-right v-if="browserCanOpenFile" /> 
            <b-icon-download v-else />
            {{ buttonText }}
          </b-button>
          <b-button v-if="canShow && !shown" @click="show" variant="primary">
            <b-icon-eye />
            <template v-if="isThumbnail">&nbsp;Show thumbnail</template>
            <template v-else>&nbsp;Show on map</template>
          </b-button>
        </b-button-group>
        <b-card-text class="mt-4" v-if="asset.description">
          <Description :description="asset.description" :compact="true" />
        </b-card-text>
        <Metadata class="mt-4" :data="asset" :context="context" :ignoreFields="ignore" title="" type="Asset" />
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconBoxArrowUpRight, BIconCheck, BIconChevronRight, BIconChevronDown, BIconDownload, BIconEye } from 'bootstrap-vue';
import { Formatters } from '@radiantearth/stac-fields';
import { mapGetters, mapState } from 'vuex';
import Description from './Description.vue';
import Metadata from './Metadata.vue';
import STAC from '../models/stac';
import Utils, { browserImageTypes, browserProtocols, geotiffMediaTypes } from '../utils';

export const MIME_TYPES = browserImageTypes.concat(geotiffMediaTypes);

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
    Metadata
  },
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
    ...mapState(['url']),
    ...mapGetters(['tileRendererType', 'getRequestUrl']),
    uid() {
      return (this.definition ? 'item-def-' : 'asset-') + String(this.id);
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
      else if (this.tileRendererType === 'server' && MIME_TYPES.includes(this.asset.type)) {
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
      // Otherwise, all images that a browser can read are supported
      else if (MIME_TYPES.includes(this.asset.type)) {
        return true;
      }
      return false;
    },
    shouldCopy() {
      if (this.isGdalVfs) {
        return true;
      }

      return !this.isBrowserProtocol;
    },
    fileFormat() {
      if (this.asset.type) {
        return Formatters.formatMediaType(this.asset.type);
      }
      return null;
    },
    shortFileFormat() {
      if (this.asset.type) {
        return Formatters.formatMediaType(this.asset.type, null, {shorten: true});
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
      return !this.protocol || browserProtocols.includes(this.protocol);
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
        return 'Open';
      }
      let text = [];
      let preposition = 'for';
      if (this.isGdalVfs) {
        text.push('Copy GDAL VFS URL');
      }
      else if (this.shouldCopy) {
        text.push('Copy URL');
      }
      else {
        text.push('Download');
        preposition = 'from';
      }
      if (!this.isBrowserProtocol && this.from) {
        text.push(preposition);
        text.push(this.from);
      }
      return text.join(' ');
    }
  },
  created() {
    if (typeof this.expand === 'boolean') {
      this.expanded = this.expand;
    }
    else {
      this.expanded = false;
    }
  },
  methods: {
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
          return 'Amazon S3';
        case 'abfs':
        case 'abfss':
          return 'Microsoft Azure';
        case 'gcs':
          return 'Google Cloud';
        case 'ftp':
          return 'FTP';
        case 'oss':
          return 'Alibaba Cloud';
        case 'file':
          return 'local file system';
      }
      return '';
    }
  }
};
</script>

<style lang="scss">
#stac-browser .asset {
  .btn-asset {
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.8rem;

    .badges {
      .badge {
        line-height: 1.2em;
        height: 1.7em;
        text-transform: uppercase;
      }
    }
  }
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