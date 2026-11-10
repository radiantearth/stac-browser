<template>
  <section v-if="labelTables.length > 0 || infoSections.length > 0" class="collection-overview mb-4">
    <h2>Dataset Overview</h2>
    <dl>
      <template v-for="table in labelTables" :key="table.heading">
        <dt>{{ table.heading }}</dt>
        <dd>
          <LabelTable :items="table.rows" :name-label="table.nameLabel" />
        </dd>
      </template>
      <template v-for="section in infoSections" :key="section.heading">
        <dt>{{ section.heading }}</dt>
        <dd>{{ section.value }}</dd>
      </template>
    </dl>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import LabelTable from './LabelTable.vue';
import { EXTRA_FIELD_TABLES, QUERYABLE_TABLES, QUERYABLE_TEXT } from './collectionOverviewConfig.js';
import { fetchSchemaProperties } from '../search-schemas';

// Widget for collection pages: label tables from Cal-Adapt's collection fields
// and readable names for the collection's queryable values.
export default {
  name: 'CollectionOverview',
  components: { LabelTable },
  data: () => ({ labelTables: [], infoSections: [] }),
  computed: {
    ...mapState(['data'])
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
      this.labelTables = [];
      this.infoSections = [];
      if (!stac?.isCollection) {
        return;
      }

      // Tables from collection-level extra fields
      for (const { key, heading, nameLabel } of EXTRA_FIELD_TABLES) {
        const labels = stac[key];
        if (labels) {
          this.labelTables.push({
            heading,
            nameLabel,
            rows: Object.entries(labels).map(([id, label]) => ({ id, label }))
          });
        }
      }

      // Tables and text sections from queryables
      const link = stac.getQueryablesLink();
      if (!link) {
        return;
      }
      try {
        const props = Object.fromEntries(await fetchSchemaProperties(this.$store, link));
        if (stac !== this.data) {
          return; // the page changed while loading
        }
        for (const [key, { heading, nameLabel, values }] of Object.entries(QUERYABLE_TABLES)) {
          if (props[key]?.enum?.length) {
            this.labelTables.push({
              heading,
              nameLabel,
              rows: props[key].enum.map(v => ({ id: v, label: values[v] || v }))
            });
          }
        }
        this.infoSections = Object.entries(QUERYABLE_TEXT)
          .filter(([key]) => props[key]?.enum?.length)
          .map(([key, { label, values }]) => ({
            heading: label,
            value: props[key].enum.map(v => values[v] ? `${values[v]} (${v})` : v).join(', ')
          }));
      } catch (e) {
        console.error('CollectionOverview:', e);
      }
    }
  }
};
</script>
