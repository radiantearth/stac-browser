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
        <b-button-group class="actions" v-if="href">
          <b-button :href="href" target="_blank" variant="outline-primary">
            Download {{ fileFormat }}
            <template v-if="from && !isBrowsable">
              from {{ from }}
            </template>
          </b-button>
          <b-button v-if="canShow && shown" :pressed="true" variant="outline-primary" class="inactive">
            <b-icon-check /> Currently shown
          </b-button>
          <b-button v-else-if="canShow" @click="show" variant="outline-primary">
            <b-icon-eye /> Show
          </b-button>
        </b-button-group>
        <b-card-title v-else>{{ fileFormat }}</b-card-title>
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
import { mapState } from 'vuex';
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
      ignore: ['href', 'title', 'description', 'type', 'roles']
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
    isThumbnail() {
      return Array.isArray(this.asset.roles) && this.asset.roles.includes('thumbnail');
    },
    canShow() {
      if (typeof this.asset.type !== 'string') {
        return false;
      }
      // Only http(s) links and relative links are supported
      if (!this.isBrowsable) {
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
    href() {
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
      switch(this.protocol) {
        case 's3':
          return 'Amazon S3';
        case 'gcs':
          return 'Google Cloud';
        case 'ftp':
          return 'FTP server';
        default:
          return '';
      }
    }
  },
  methods: {
    show() {
      let absoluteAsset =  Object.assign({}, this.asset, {href: this.href});
      this.$emit('show', absoluteAsset, this.id, this.isThumbnail);
    }
  }
}
</script>

<style lang="scss">
.asset {
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