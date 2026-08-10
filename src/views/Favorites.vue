<template>
  <main class="favorites d-flex flex-column">
    <b-alert variant="warning" show>
      {{ $t('favorites.localOnly') }}
      <div class="mt-2">
        <b-button-group size="sm">
          <b-button variant="warning" :title="$t('favorites.importDescription')" @click="openImportDialog">
            <b-icon-box-arrow-in-down /> {{ $t('favorites.import') }}
          </b-button>
          <b-dropdown size="sm" variant="warning" :title="$t('favorites.exportDescription')" :disabled="favorites.length === 0">
            <template #button-content>
              <b-icon-box-arrow-up /> {{ $t('favorites.export') }}
            </template>
            <b-dropdown-item v-for="format in ['json', 'csv', 'excel', 'stac']" :key="format" @click="exportFavorites(format)">
              {{ $t(`favorites.exportFormats.${format}`) }}
            </b-dropdown-item>
          </b-dropdown>
        </b-button-group>
        <input type="file" accept=".json,.csv,application/json,text/csv" class="d-none" ref="importFile" @change="importFavorites">
      </div>
    </b-alert>
    <b-alert v-if="importError" variant="danger" show dismissible @close="importError = null">{{ importError }}</b-alert>
    <b-alert v-else-if="importedCount !== null" variant="success" show dismissible @close="importedCount = null">
      {{ $t('favorites.imported', {count: importedCount}) }}
    </b-alert>
    <b-alert v-if="favorites.length === 0" variant="info" show>{{ $t('favorites.empty') }}</b-alert>
    <b-row v-else-if="visibleFavorites.length > 0">
      <b-col v-if="catalogs.length > 0" class="catalogs-container">
        <Catalogs :catalogs="catalogs" enforceView="cards">
          <template #footer="{source}">
            <b-button size="sm" variant="outline-danger" :title="$t('favorites.remove')" @click="remove(source)">
              <b-icon-star-fill /> {{ $t('favorites.remove') }}
            </b-button>
          </template>
        </Catalogs>
      </b-col>
      <b-col v-if="items.length > 0" class="items-container">
        <Items v-if="items.length > 0" :items="items" enforceView="cards">
          <template #footer="{source}">
            <b-button size="sm" variant="outline-danger" :title="$t('favorites.remove')" @click="remove(source)">
              <b-icon-star-fill /> {{ $t('favorites.remove') }}
            </b-button>
          </template>
        </Items>
      </b-col>
    </b-row>
  </main>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapGetters, mapState } from 'vuex';
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next';
import Utils from '../utils';
import { parseImport, toCsv, toStacCatalog } from '../store/favorites';

export default defineComponent({
  name: "Favorites",
  components: {
    BDropdown,
    BDropdownItem,
    Catalogs: defineAsyncComponent(() => import('../components/Catalogs.vue')),
    Items: defineAsyncComponent(() => import('../components/Items.vue'))
  },
  data() {
    return {
      importError: null,
      importedCount: null
    };
  },
  computed: {
    ...mapState(['allowExternalAccess', 'catalogUrl', 'uiLanguage']),
    ...mapState('favorites', ['favorites']),
    ...mapGetters(['isExternalUrl', 'root']),
    // Favorites for external catalogs (e.g. imported from a file or stored
    // under a previous configuration) can't be browsed when external access
    // is not allowed, so don't show them.
    visibleFavorites() {
      if (this.allowExternalAccess) {
        return this.favorites;
      }
      return this.favorites.filter(favorite => !this.isExternalUrl(favorite.href, false));
    },
    // Always sort by title, it's the only information that is available
    // without loading all favorites, which doesn't scale for many favorites.
    sortedFavorites() {
      const collator = new Intl.Collator(this.uiLanguage);
      return this.visibleFavorites
        .slice(0)
        .sort((a, b) => collator.compare(a.title || a.href, b.title || b.href));
    },
    catalogs() {
      return this.sortedFavorites
        .filter(favorite => favorite.type !== 'Item')
        .map(favorite => Utils.createLink(favorite.href, 'child', favorite.title));
    },
    items() {
      return this.sortedFavorites
        .filter(favorite => favorite.type === 'Item')
        .map(favorite => Utils.createLink(favorite.href, 'item', favorite.title));
    },
  },
  async created() {
    this.$store.commit('showPage', {
      page: () => ({
        title: this.$t('favorites.title')
      })
    });
    // Load the root catalog in the background, e.g. after a page refresh
    if (!this.root && this.catalogUrl) {
      await this.$store.dispatch('load', { url: this.catalogUrl });
    }
  },
  methods: {
    remove(source) {
      // The source may be the created Link or, once loaded, the STAC entity
      this.$store.commit('favorites/remove', source.getAbsoluteUrl());
    },
    exportFavorites(format) {
      let content, filename, mimeType;
      if (format === 'csv') {
        content = toCsv(this.favorites);
        filename = 'stac-browser-favorites.csv';
        mimeType = 'text/csv';
      }
      else if (format === 'excel') {
        // Excel wants a BOM (for UTF-8 detection) and a ; separator
        content = '\uFEFF' + toCsv(this.favorites, ';');
        filename = 'stac-browser-favorites.csv';
        mimeType = 'text/csv';
      }
      else if (format === 'stac') {
        const catalog = toStacCatalog(this.favorites, this.$t('favorites.title'));
        content = JSON.stringify(catalog, null, 2);
        filename = 'catalog.json';
        mimeType = 'application/json';
      }
      else {
        content = JSON.stringify(this.favorites, null, 2);
        filename = 'stac-browser-favorites.json';
        mimeType = 'application/json';
      }
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    openImportDialog() {
      this.$refs.importFile.click();
    },
    async importFavorites(event) {
      const file = event.target.files[0];
      // Reset the input so that selecting the same file again triggers the change event
      event.target.value = '';
      if (!file) {
        return;
      }
      this.importError = null;
      this.importedCount = null;
      try {
        const data = parseImport(await file.text());
        this.importedCount = await this.$store.dispatch('favorites/import', data);
      } catch (error) {
        console.error(error);
        this.importError = this.$t('favorites.importInvalid');
      }
    }
  }
});
</script>

<style lang="scss">
@import 'bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser .favorites {
  // Stack the catalog and item lists on smaller screens
  @include media-breakpoint-down(lg) {
    > .row {
      > .catalogs-container,
      > .items-container {
        min-width: 100%;
      }
    }
  }
}
</style>
