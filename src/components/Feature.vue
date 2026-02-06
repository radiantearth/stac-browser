<template>
  <b-card class="feature-card" :title="title">
    <template v-if="hasProps">
      <b-row v-for="data in formatted" :key="data.field" class="mb-2">
        <b-col md="12" class="label">
          <strong v-html="data.label" />
        </b-col>
        <b-col md="12" class="value">
          <span v-html="data.formatted" />
        </b-col>
      </b-row>
    </template>
    <template v-else>
      <em>{{ $t('features.noProperties') }}</em>
    </template>
  </b-card>
</template>

<script>
import Utils from '../utils';
import { formatKey } from '@radiantearth/stac-fields/helper';
import DataTypes from '@radiantearth/stac-fields/datatypes';

export default {
  name: "Feature",
  props: {
    feature: {
      type: Object,
      required: true
    }
  },
  computed: {
    title() {
      return this.feature.properties?.title || this.feature.id || this.feature.properties?.id || this.feature.geometry?.type;
    },
    formatted() {
      const formatted = [];
      if (this.hasProps) {
        for (const key in this.feature.properties) {
          const value = this.feature.properties[key];
          formatted.push({
            field: key,
            label: formatKey(key),
            value,
            formatted: DataTypes.format(value)
          });
        }
      }
      return formatted;
    },
    hasProps() {
      return Utils.size(this.feature.properties) > 0;
    }
  }
};
</script>
