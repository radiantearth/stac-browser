<template>
  <section v-if="labelTables.length > 0 || infoSections.length > 0" class="collection-overview mb-4">
    <h2>Dataset Overview</h2>
    <dl>
      <template v-for="table in labelTables">
        <dt :key="table.heading">{{ table.heading }}</dt>
        <dd :key="table.heading + '-dd'">
          <LabelTable :items="table.rows" :name-label="table.nameLabel" />
        </dd>
      </template>
      <template v-for="section in infoSections">
        <dt :key="section.heading">{{ section.heading }}</dt>
        <dd :key="section.heading + '-val'">{{ section.value }}</dd>
      </template>
    </dl>
  </section>
</template>

<script>
import LabelTable from './LabelTable.vue';
import { EXTRA_FIELD_TABLES, QUERYABLE_TABLES, QUERYABLE_TEXT } from './collectionOverviewConfig.js';
import Utils, { schemaMediaType } from '../utils';
import { ogcQueryables } from '../rels';
import { stacRequest } from '../store/utils';

export default {
  name: 'CollectionOverview',
  components: { LabelTable },
  props: { stac: { type: Object, required: true } },
  data: () => ({ labelTables: [], infoSections: [] }),
  async mounted() {
    // Tables from collection-level extra_fields
    for (const { key, heading, nameLabel } of EXTRA_FIELD_TABLES) {
      const labels = this.stac[key];
      if (labels) {
        this.labelTables.push({
          heading,
          nameLabel,
          rows: Object.entries(labels).map(([id, label]) => ({ id, label }))
        });
      }
    }

    // Tables and text sections from queryables
    const link = Utils.getLinksWithRels(this.stac.links, ogcQueryables)
      .find(l => Utils.isMediaType(l.type, schemaMediaType, true));
    if (!link) return;
    try {
      const { data } = await stacRequest(this.$store, link);
      const props = data?.properties || {};

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
};
</script>
