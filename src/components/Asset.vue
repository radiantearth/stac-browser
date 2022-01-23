<template>
  <b-card class="asset" no-body>
    <b-card-header header-tag="header" role="tab" class="p-0">
      <b-button block v-b-toggle="id" variant="asset" squared class="p-2 d-flex">
        {{ asset.title || id }}
        <div class="badges ml-1 mr-2" v-if="Array.isArray(asset.roles)">
          <b-badge v-for="role in asset.roles" :key="role" :variant="role === 'data' ? 'primary' : 'secondary'" class="role ml-1 mb-1">{{ role }}</b-badge>
          <b-badge v-if="shown" variant="success" class="shown ml-1 mb-1" title="This is the asset currently shown"><b-icon-eye /></b-badge>
        </div>
        <span class="ml-auto" aria-hidden="true">
          <b-icon-chevron-down v-if="expanded" />
          <b-icon-chevron-up v-else />
        </span>
      </b-button>
    </b-card-header>
    <b-collapse :id="id" v-model="expanded" role="tabpanel">
      <b-card-body>
        <b-card-title>{{ fileFormat }}</b-card-title>
        <b-button-group class="actions" v-if="href">
          <CopyButton v-if="isGdalVfs" variant="outline-primary" :copyText="href">
            {{ buttonText }}
          </CopyButton>
          <b-button v-else :href="href" target="_blank" variant="outline-primary">
            {{ buttonText }}
          </b-button>
          <b-button v-if="canShow && shown" :pressed="true" variant="outline-primary" class="inactive">
            <b-icon-check /> Currently shown
          </b-button>
          <b-button v-else-if="canShow" @click="show" variant="outline-primary">
            <b-icon-eye /> Show
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
import { BCollapse, BIconCheck, BIconChevronUp, BIconChevronDown, BIconEye } from 'bootstrap-vue';
import { Formatters } from '@radiantearth/stac-fields';
import { MIME_TYPES } from 'stac-layer/src/data';
import { mapGetters, mapState } from 'vuex';
import Description from './Description.vue';
import Metadata from './Metadata.vue';
import STAC from '../stac';
import Utils from '../utils';

export default {
  name: 'Asset',
  components: {
    BCollapse,
    BIconCheck,
    BIconChevronDown,
    BIconChevronUp,
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
        'href', 'title', 'description', 'type', 'roles',
        'table:storage_options', 'xarray:open_kwargs', 'xarray:storage_options'
      ]
    };
  },
  created() {
    if (typeof this.expand === 'boolean') {
      this.expanded = this.expand;
    }
    else {
      // Expand assets with role data by default
      this.expanded = Array.isArray(this.asset.roles) && this.asset.roles.includes('data');
    }
  },
  watch: {
    shown(show, wasShown) {
      if (show && !wasShown) {
        this.expanded = true;
      }
    }
  },
  computed: {
    ...mapState(['url']),
    ...mapGetters(['tileRendererType']),
    isThumbnail() {
      return Array.isArray(this.asset.roles) && this.asset.roles.includes('thumbnail');
    },
    canShow() {
      // We need to know the type, otherwise we don't even try to show it
      if (typeof this.asset.type !== 'string') {
        return false;
      }
      // If the tile renderer is a tile server, we can't really know what it supports so we pass all images
      else if (this.tileRendererType === 'server' && this.asset.type.toLowerCase().startsWith('image/')) {
        return true;
      }
      // Don't pass GDAL VFS URIs to client-side tile renderer: https://github.com/radiantearth/stac-browser/issues/116
      else if (this.isGdalVfs && this.tileRendererType === 'client') {
        return false;
      }
      // Otherwise, only http(s) links and relative links are supported
      else if (!this.isBrowsable) {
        return false;
      }
      for(let type in MIME_TYPES) {
        if (MIME_TYPES[type].includes(this.asset.type)) {
          return true;
        }
      }
      return false;
    },
    fileFormat() {
      if (this.asset.type) {
        return Formatters.formatMediaType(this.asset.type);
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
    isBrowsable() {
      return (this.protocol === 'http' || this.protocol === 'https');
    },
    isGdalVfs() {
      return Utils.isGdalVfsUri(this.asset.href);
    },
    href() {
      if (typeof this.asset.href !== 'string') {
        return null;
      }
      let baseUrl;
      if (this.context instanceof STAC) {
        baseUrl = this.context.getAbsoluteUrl();
      }
      else {
        baseUrl = this.url;
      }
      return Utils.toAbsolute(this.asset.href, baseUrl);
    },
    from() {
      const s3 = 'Amazon S3';
      const azure = 'Microsoft Azure';
      const gc = 'Google Cloud';
      const ftp = 'FTP';
      const ali = 'Alibaba Cloud';
      switch(this.protocol) {
        case 's3':
          return s3;
        case 'abfs':
        case 'abfss':
          return azure;
        case 'gcs':
          return gc;
        case 'ftp':
          return ftp;
      }
      if (this.isGdalVfs) {
        let type = this.asset.href.match(/^\/vsi([a-z\d]+)(_streaming)?\//);
        if (type) {
          switch(type[1]) {
            case 's3':
              return s3;
            case 'az':
            case 'adls':
              return azure;
            case 'gs':
              return gc;
            case 'oss':
              return ali;
          }
        }
      }
      return '';
    },
    buttonText() {
      let text = [this.isGdalVfs ? 'Copy GDAL VFS URL' : 'Download'];
      if (this.from && !this.isBrowsable) {
        text.push(this.isGdalVfs ? 'for' : 'from');
        text.push(this.from);
      }
      return text.join(' ');
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
    }
  }
}
</script>

<style lang="scss">
.asset {
  .card-title {
    font-size: 1.3em;
  }
  .btn-asset {
    text-align: left;

    .badges {
      .badge {
        line-height: 1.2em;
        height: 1.7em;
      }

      .role {
        text-transform: uppercase;
      }
    }
  }
  .metadata {
    h4 {
      font-size: 1.2rem;
    }
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