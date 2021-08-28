<template>
  <b-card class="asset" no-body>
    <b-card-header header-tag="header" role="tab" class="p-0">
      <b-button block v-b-toggle="id" variant="asset" squared class="p-2 d-flex">
        {{ asset.title || id }}
        <div class="roles ml-1 mr-2" v-if="Array.isArray(asset.roles)">
          <b-badge v-for="role in asset.roles" :key="role" :variant="role === 'data' ? 'primary' : 'secondary'" class="ml-1 mb-1">{{ role }}</b-badge>
        </div>
        <span class="ml-auto" aria-hidden="true">
          <b-icon-chevron-down v-if="expanded" />
          <b-icon-chevron-up v-else />
        </span>
      </b-button>
    </b-card-header>
    <b-collapse :id="id" v-model="expanded" role="tabpanel">
      <b-card-body>
        <b-button-group v-if="asset.href">
          <b-button :href="asset.href" target="_blank" variant="outline-primary">
            Download {{ fileFormat }}
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
import { BCollapse, BIconChevronUp, BIconChevronDown } from 'bootstrap-vue';
import { Formatters } from '@radiantearth/stac-fields';
import Description from './Description.vue';
import Metadata from './Metadata.vue';

export default {
  name: 'Asset',
  components: {
    BCollapse,
    BIconChevronDown,
    BIconChevronUp,
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
  computed: {
    fileFormat() {
      if (this.asset.type) {
        return Formatters.formatMediaType(this.asset.type);
      }
      return null;
    }
  }
}
</script>

<style lang="scss">
.asset {
  .btn-asset {
    text-align: left;

    .badge {
      text-transform: uppercase;
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