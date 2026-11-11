<template>
  <section v-if="filters.length > 0" class="item-filters mb-3" aria-labelledby="item-filters-title">
    <header>
      <h3 id="item-filters-title">{{ $t('itemFilters.label') }}</h3>
      <b-button v-if="hasSelection" size="sm" variant="link" class="p-0" @click="clear">{{ $t('catalogFilters.clear') }}</b-button>
    </header>
    <div class="item-filter-grid">
      <div v-for="filter in filters" :key="filter.key" class="item-filter">
        <label :for="`item-filter-${filter.key}`">{{ filter.label }}</label>
        <select :id="`item-filter-${filter.key}`" v-model="selected[filter.key]" class="form-select form-select-sm" @change="apply">
          <option :value="null">{{ $t('itemFilters.any') }}</option>
          <option v-for="option in filter.options" :key="option.value" :value="option.value" :title="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import Queryable from '../models/cql2/queryable';
import { fetchSchemaProperties } from '../search-schemas';
import { EXTRA_FIELD_TABLES, QUERYABLE_TABLES, QUERYABLE_TEXT } from './collectionOverviewConfig.js';

// Queryables that don't help pick a file
const SKIPPED = ['lat', 'lon', 'elevation_m', 'file:size'];

// Dropdowns above the items list on collection pages, one per queryable with more
// than one value, with readable names from the same config as the Dataset Overview.
// Applies the selection through the same function as STAC Browser's own filter panel
// (Catalog.vue's filterItems), so counts and paging keep working.
export default {
  name: 'ItemFilters',
  props: {
    // Catalog.vue's filterItems(filters): loads the items for the given filters
    filterItems: {
      type: Function,
      required: true
    }
  },
  data: () => ({ filters: [], selected: {}, loading: false, queued: null }),
  computed: {
    ...mapState(['data']),
    hasSelection() {
      return Object.values(this.selected).some(value => value !== null);
    }
  },
  watch: {
    data: {
      immediate: true,
      handler() {
        this.load();
      }
    }
  },
  methods: {
    async load() {
      const stac = this.data;
      this.filters = [];
      this.selected = {};
      const link = stac?.isCollection ? stac.getQueryablesLink() : null;
      if (!link) {
        return;
      }
      try {
        const props = await fetchSchemaProperties(this.$store, link);
        if (stac !== this.data) {
          return; // the page changed while loading
        }
        this.filters = props
          .filter(([key, schema]) => !SKIPPED.includes(key) && Array.isArray(schema.enum) && schema.enum.length > 1)
          .map(([key, schema]) => this.buildFilter(stac, key, schema))
          // Variable first, then the order the API lists them in
          .sort((a, b) => b.isVariable - a.isVariable);
        this.selected = Object.fromEntries(this.filters.map(filter => [filter.key, null]));
      } catch (e) {
        console.error('ItemFilters:', e);
      }
    },
    buildFilter(stac, key, schema) {
      const table = EXTRA_FIELD_TABLES.find(t => t.queryables.includes(key));
      const config = QUERYABLE_TABLES[key] || QUERYABLE_TEXT[key];
      const names = (table && stac[table.key]) || config?.values || {};
      const label = table?.nameLabel || config?.nameLabel || config?.label || new Queryable(key, schema).title;
      const options = schema.enum
        .map(value => ({ value, label: names[value] || String(value) }))
        // numeric: true puts "9 km" before "45 km" and ge95F before ge100F
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
      return { key, label, options, isVariable: table?.key === 'caladapt:variable_labels' };
    },
    clear() {
      this.selected = Object.fromEntries(Object.keys(this.selected).map(key => [key, null]));
      this.apply();
    },
    async apply() {
      // Load one selection at a time and only the latest one after that, so a slow
      // response for an older selection can't replace the list for a newer one
      this.queued = this.requestFilters();
      if (!this.loading) {
        await this.loadQueued();
      }
    },
    async loadQueued() {
      const filters = this.queued;
      this.queued = null;
      this.loading = true;
      await this.filterItems(filters);
      this.loading = false;
      if (this.queued) {
        await this.loadQueued();
      }
    },
    requestFilters() {
      const clauses = Object.entries(this.selected)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => `"${key}" = ${this.cqlValue(value)}`);
      if (clauses.length === 0) {
        return {};
      }
      const text = clauses.join(' AND ');
      // Utils.addFiltersToLink calls serialize() to add the filter to the request
      return { filters: { serialize: () => ({ filter: text, 'filter-lang': 'cql2-text' }) } };
    },
    cqlValue(value) {
      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }
      return String(value);
    }
  }
};
</script>

<style lang="scss">
.item-filters {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  padding: 0.75rem 1rem 1rem;

  > header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    > h3 {
      font-size: 1rem;
      margin: 0;
    }
  }

  // Equal-width columns, as many as fit
  > .item-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: 0.75rem;
  }

  .item-filter {
    min-width: 0;

    > label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
  }
}
</style>
