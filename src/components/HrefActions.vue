<template>
  <b-button-group class="actions" :vertical="vertical" :size="size" v-if="href">
    <b-button v-if="isBrowserProtocol && isAsset" :href="href" target="_blank" variant="primary">
      <b-icon-box-arrow-up-right v-if="browserCanOpenFile" /> 
      <b-icon-download v-else />
      {{ buttonText }}
    </b-button>
    <CopyButton variant="primary" :copyText="href">
      {{ copyButtonText }}
    </CopyButton>
    <b-button v-if="isAsset && canShow && !shown" @click="show" variant="primary">
      <b-icon-eye class="mr-1" />
      <template v-if="isThumbnail">{{ $t('assets.showThumbnail') }}</template>
      <template v-else>{{ $t('assets.showOnMap') }}</template>
    </b-button>
    <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
      <component v-if="action.icon" :is="action.icon" class="mr-1" />
      {{ action.text }}
    </b-button>
  </b-button-group>
</template>


<script>
import { BIconBoxArrowUpRight, BIconDownload, BIconEye } from 'bootstrap-vue';
import Description from './Description.vue';
import STAC from '../models/stac';
import Utils, { browserProtocols, imageMediaTypes, mapMediaTypes } from '../utils';
import { mapGetters } from 'vuex';
import AssetActions from '../../assetActions.config';
import LinkActions from '../../linkActions.config';

export default {
  name: 'HrefActions',
  components: {
    BIconBoxArrowUpRight,
    BIconDownload,
    BIconEye,
    CopyButton: () => import('./CopyButton.vue'),
    Description,
    Metadata: () => import('./Metadata.vue')
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    isAsset: {
      type: Boolean,
      default: false
    },
    vertical: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    },
    shown: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['getRequestUrl']),
    actions() {
      return Object.entries(this.isAsset ? AssetActions : LinkActions)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    canShow() {
      // We need to know the type, otherwise we don't even try to show it
      if (typeof this.data.type !== 'string') {
        return false;
      }
      // If the tile renderer is a tile server, we can't really know what it supports so we pass all images
      else if (this.tileRendererType === 'server' && imageMediaTypes.includes(this.data.type)) {
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
      else if (mapMediaTypes.includes(this.data.type)) {
        return true;
      }
      return false;
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
    isThumbnail() {
      if (this.isAsset) {
        return Array.isArray(this.data.roles) && this.data.roles.includes('thumbnail');
      }
      else {
        return this.data.rel === 'preview' && Utils.canBrowserDisplayImage(this.data);
      }
    },
    isGdalVfs() {
      return Utils.isGdalVfsUri(this.data.href);
    },
    href() {
      if (typeof this.data.href !== 'string') {
        return null;
      }
      let baseUrl = null;
      if (this.context instanceof STAC) {
        baseUrl = this.context.getAbsoluteUrl();
      }
      return this.getRequestUrl(this.data.href, baseUrl);
    },
    from() {
      if (this.isGdalVfs) {
        let type = this.data.href.match(/^\/vsi([a-z\d]+)(_streaming)?\//);
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
      if (Utils.canBrowserDisplayImage(this.data)) {
        return true;
      }
      else if (typeof this.data.type === 'string') {
        switch(this.data.type.toLowerCase()) {
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
      let where = (!this.isBrowserProtocol && this.from) ? 'withSource' : 'generic';
      return this.$t(`assets.download.${where}`, {source: this.from});
    },
    copyButtonText() {
      let what = this.isGdalVfs ? 'copyGdalVfsUrl' : 'copyUrl';
      let where = (!this.isBrowserProtocol && this.from) ? 'withSource' : 'generic';
      return this.$t(`assets.${what}.${where}`, {source: this.from});
    }
  },
  methods: {
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
    show() {
      let data = Object.assign({}, this.data);
      // Override asset href with absolute URL if not a GDAL VFS
      if (!this.isGdalVfs) {
        data.href = this.href;
      }
      this.$emit('show', data, this.id, this.isThumbnail);
    }
  }
};
</script>