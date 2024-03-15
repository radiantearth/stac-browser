<template>
  <b-card no-body>
    <b-card-header>
      <component :is="isCore ? 'span': 'code'" class="name mr-1" :title="id">{{ name }}</component>
      <b-badge v-if="version" variant="primary ml-1">{{ version }}</b-badge>
      <b-badge v-if="!isCore" variant="dark ml-1">{{ $t('source.extension') }}</b-badge>
    </b-card-header>
    <b-list-group flush>
      <b-list-group-item v-if="errors.length === 0" variant="success">
        {{ $t('source.valid') }}
      </b-list-group-item>
      <template v-else>
        <b-list-group-item v-for="(error, i) in errors" :key="i" variant="danger">
          {{ makeAjvErrorMessage(error) }}
        </b-list-group-item>
      </template>
    </b-list-group>
  </b-card>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue';
import URI from 'urijs';
import Utils from '../utils';

const VERSION_REGEXP = /\/(v?\d+\.\d+[^/]+)(\/|$)/;

export default {
  name: "ValidationResult",
  components: {
    BListGroup,
    BListGroupItem
  },
  props: {
    id: {
      type: String,
      required: true
    },
    errors: {
      type: Array,
      required: true
    },
    context: {
      type: Object,
      required: true
    }
  },
  computed: {
    isCore() {
      return this.id === 'core';
    },
    type() {
      switch(this.context.type) {
        case "Feature":
          return this.$tc('stacItem');
        case "Catalog":
          return this.$tc(`stacCatalog`);
        case "Collection":
          return this.$tc(`stacCollection`);
        default:
          return this.context.type;
      }
    },
    name() {
      if (this.isCore) {
        return this.type;
      }
      else if (this.id.startsWith('https://stac-extensions.github.io/')) {
        return URI(this.id)
          .directory()
          .replace(VERSION_REGEXP, '/')
          .replace(/\//g, ' ')
          .trim();
      }
      return this.id
        .replace(/^\w+:\/\//, '')
        .replace(/\.github\.io/, '')
        .replace(/\/[^/]+\.json$/, '')
        .replace(VERSION_REGEXP, '');
    },
    version() {
      if (this.isCore) {
        return this.context.version;
      }
      let v = this.id.match(VERSION_REGEXP);
      if (v) {
        return v[1];
      }
      return null;
    }
  },
  methods: {
    makeAjvErrorMessage(error) {
      let message = error.message;
      if (Utils.isObject(error.params) && Object.keys(error.params).length > 0) {
        let params = Object.entries(error.params)
          .map(([key, value]) => {
            let label = key.replace(/([^A-Z]+)([A-Z])/g, "$1 $2").toLowerCase();
            return `${label}: ${value}`;
          })
          .join(', ');
        message += ` (${params})`;
      }
      if (error.instancePath) {
        return `${error.instancePath} ${message}`;
      }
      else if (error.schemaPath) {
        return this.$t('messageForSchemaError', {message, schemaPath: error.schemaPath});
      }
      else if (message) {
        return message;
      }
      else {
        return String(error);
      }
    }
  }
};
</script>
