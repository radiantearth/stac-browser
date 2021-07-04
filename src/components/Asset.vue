<template>
  <b-card no-body>
    <b-card-header header-tag="header" role="tab" class="p-0">
      <b-button block v-b-toggle="id" variant="asset" squared class="p-2 d-flex">
        {{ asset.title || id }}
        <div class="roles ml-1" v-if="Array.isArray(asset.roles)">
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
        <b-card-text v-if="asset.description">
          <Description v-if="data.description" :description="data.description" :compact="true" />
        </b-card-text>
        <b-card-text>
          ToDo: More metadata like bands etc.
        </b-card-text>
        <b-button-group>
          <b-button :href="asset.href" target="_blank" variant="outline-primary">{{ downloadLabel }}</b-button>
          <b-button v-if="canShowOnMap" @click="showOnMap" target="_blank" variant="outline-primary">Show on Map</b-button>
        </b-button-group>
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconChevronUp, BIconChevronDown } from 'bootstrap-vue';
import { Formatters } from '@radiantearth/stac-fields';
import Utils from '../utils';

export default {
  name: 'Asset',
  components: {
    BCollapse,
    BIconChevronDown,
    BIconChevronUp
  },
  props: {
    asset: {
      type: Object,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      expanded: false
    };
  },
  created() {
    // Expand all assets with role data by default
    this.expanded = Array.isArray(this.asset.roles) && this.asset.roles.includes('data');
  },
  computed: {
    downloadLabel() {
      if (this.asset.type) {
        let format = Formatters.formatMediaType(this.asset.type);
        return `Download ${format}`;
      }
      else {
        return 'Download';
      }
    },
    canShowOnMap() {
      return (this.asset.type && (Utils.canBrowserDisplayImage(this.asset.type) || this.asset.type.startsWith('image/tif')));
    }
  },
  methods: {
    showOnMap() {
      alert('Not implemented yet')
    }
  }
}
</script>

<style>
.btn-asset {
  text-align: left;
}
.btn-asset .badge {
  text-transform: uppercase;
}
</style>