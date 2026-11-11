<template>
  <div class="pill-filters">
    <div v-for="row in rows" :key="row.key" class="pill-filter" role="group" :aria-label="row.label">
      <span class="pill-filter-label">{{ row.label }}</span>
      <div class="pill-filter-options">
        <b-button
          v-for="option in row.options" :key="option.value"
          size="sm" variant="outline-primary" class="rounded-pill"
          :pressed="modelValue[row.key].includes(option.value)"
          @click="toggle(row.key, option.value)"
        >
          {{ option.label }} <span class="pill-count">{{ option.count }}</span>
        </b-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { hasText } from 'stac-js/src/utils.js';
import { COLLECTION_FILTERS } from './collectionFilters';

// Rows of toggle pill buttons that filter the home page collections (Topic, Data type,
// Source), each pill with its number of collections. The selection is kept in the URL
// (e.g. ?.topic=energy,wind&.source=wrf) so a filtered list survives a reload and can be shared.
export default {
  name: 'PillFilters',
  props: {
    catalogs: {
      type: Array,
      required: true
    },
    // Selected values per row, see emptyPillSelection() in collectionFilters.js
    modelValue: {
      type: Object,
      required: true
    }
  },
  emits: ['update:modelValue'],
  computed: {
    ...mapState(['stateQueryParameters']),
    rows() {
      const topicCounts = {};
      for (const catalog of this.catalogs) {
        for (const keyword of Array.isArray(catalog.keywords) ? catalog.keywords : []) {
          topicCounts[keyword] = (topicCounts[keyword] || 0) + 1;
        }
      }
      const topic = {
        key: 'topic',
        label: this.$t('catalogFilters.topic'),
        options: Object.keys(topicCounts).sort().map(value => ({ value, label: value, count: topicCounts[value] }))
      };
      const fields = COLLECTION_FILTERS.map(filter => ({
        key: filter.key,
        label: this.$t(`catalogFilters.${filter.key}.label`),
        // Values no collection has are left out
        options: filter.values
          .map(value => ({
            value,
            label: this.$t(`catalogFilters.${filter.key}.${value}`),
            count: this.catalogs.filter(catalog => catalog[filter.field] === value).length
          }))
          .filter(option => option.count > 0)
      }));
      return [topic, ...fields].filter(row => row.options.length > 0);
    }
  },
  watch: {
    modelValue: {
      handler(selection) {
        for (const [key, values] of Object.entries(selection)) {
          this.$store.commit('updateState', { type: key, value: values.length > 0 ? values : null });
        }
      },
      deep: true
    }
  },
  created() {
    // Restore the selection from the URL, where each row is a comma-separated string
    const selection = {};
    for (const key of Object.keys(this.modelValue)) {
      const value = this.stateQueryParameters[key];
      if (Array.isArray(value)) {
        selection[key] = value;
      }
      else {
        selection[key] = hasText(value) ? value.split(',') : [];
      }
    }
    this.$emit('update:modelValue', selection);
  },
  methods: {
    toggle(key, value) {
      const selected = this.modelValue[key];
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [key]: selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]
      });
    }
  }
};
</script>

<style lang="scss">
.catalog-filter > .pill-filters {
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pill-filter {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;

  > .pill-filter-label {
    flex: 0 0 6rem;
    font-weight: 600;
  }

  > .pill-filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .pill-count {
    opacity: 0.7;
    font-size: 0.85em;
  }

  // On phones, put the label above its pills so they get the full width
  @media (max-width: 575.98px) {
    flex-direction: column;
    align-items: flex-start;

    > .pill-filter-label {
      flex: none;
    }
  }
}
</style>
