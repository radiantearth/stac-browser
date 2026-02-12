<template>
  <b-accordion-item
    :id="uid"
    v-model="expanded"
    class="asset"
    body-class="asset-body"
    @update:model-value="collapseToggled"
  >
    <template #title>
      <span class="chevron" aria-hidden="true">
        <b-icon-chevron-down v-if="expanded" />
        <b-icon-chevron-right v-else />
      </span>
      <span class="title">{{ title }}</span>
      <div class="badges ms-1">
        <b-badge v-if="shown" variant="success" class="shown" :title="$t('assets.currentlyShown')">
          <b-icon-check /> {{ $t('assets.shown') }}
        </b-badge>
        <b-badge v-if="asset.deprecated" variant="warning" class="deprecated">{{ $t('deprecated') }}</b-badge>
        <template v-if="Array.isArray(asset.roles)">
          <b-badge v-for="role in sortedRoles" :key="role" :variant="role === 'data' ? 'primary' : 'secondary'" class="role">{{ displayRole(role) }}</b-badge>
        </template>
        <b-badge v-if="shortFileFormat" variant="dark" class="format" :title="fileFormat"><span v-html="shortFileFormat" /></b-badge>
      </div>
    </template>
   
    <template v-if="hasAlternatives">
      <b-card no-body class="border-0 rounded-0">
        <b-tabs lazy card>
          <b-tab :title="asset['alternate:name'] || $t('assets.alternate.main')" active no-body>
            <AssetAlternative :asset="asset" :shown="shown" hasAlternatives @show="show" />
          </b-tab>
          <b-tab v-for="(altAsset, key) in alternatives" :title="altAsset['alternate:name'] || key" :key="key" no-body>
            <AssetAlternative :asset="altAsset" :shown="shown" hasAlternatives @show="show" />
          </b-tab>
        </b-tabs>
      </b-card>
    </template>
    <AssetAlternative v-else :asset="asset" :shown="shown" @show="show" />
  </b-accordion-item>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { formatMediaType } from '@radiantearth/stac-fields/formatters';
import { mapState } from 'vuex';
import StacFieldsMixin from './StacFieldsMixin';
import Utils from '../utils';
import { Asset } from 'stac-js';
import { BCard, BTab, BTabs, BAccordionItem } from 'bootstrap-vue-next';

export default {
  name: 'Asset',
  components: {
    AssetAlternative: defineAsyncComponent(() => import('./AssetAlternative.vue')),
    BCard,
    BTab,
    BTabs,
    BAccordionItem
  },
  mixins: [
    StacFieldsMixin({ formatMediaType })
  ],
  props: {
    asset: {
      type: Object,
      required: true
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
  emits: ['show'],
  data() {
    return {
      expanded: false
    };
  },
  computed: {
    ...mapState(['stateQueryParameters']),
    type() {
      return this.definition ? 'itemdef' : 'asset';
    },
    uid() {
      return `${this.type}-${this.asset.getKey().toLowerCase().replace(/[^\w]/g, '-')}`;
    },
    title() {
      return this.asset.title || this.asset.getKey();
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
    alternatives() {
      if (!Utils.isObject(this.asset.alternate)) {
        return {};
      }

      const inherit = this.asset.toJSON();
      delete inherit.alternate;

      const alternates = {};
      for (const key in this.asset.alternate) {
        const alternate = this.asset.alternate[key];
        const merged = Object.assign({}, inherit, alternate.toJSON());
        alternates[key] = new Asset(merged, key, alternate.getContext());
      }
      
      return alternates;
    },
    hasAlternatives() {
      return Utils.size(this.alternatives) > 0;
    },
    sortedRoles() {
      if (!Array.isArray(this.asset.roles)) {
        return [];
      }
      // Sort roles with 'data' first, then alphabetically (case-insensitive)
      return [...this.asset.roles].sort((a, b) => {
        if (a === 'data') {
          return -1;
        }
        if (b === 'data') {
          return 1;
        }
        return a.toLowerCase().localeCompare(b.toLowerCase(), undefined, { sensitivity: 'base' });
      });
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
    collapseToggled(isVisible) {
      let event = isVisible ? 'openCollapsible' : 'closeCollapsible';
      this.$store.commit(event, {type: this.type, uid: this.uid});
    },
    show() {
      this.$emit('show', ...arguments);
    }
  }
};
</script>

<style lang="scss">
#stac-browser .asset {
  .asset-body {
    padding: 0;
  }

  .metadata {
    .card-columns {
      column-count: 1;
    }
    .card {
      border: 0;
    }
  }
}
</style>
