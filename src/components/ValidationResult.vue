<template>
  <b-card no-body>
    <b-card-header>
      <component :is="titleComponent" class="name mr-1" :title="id">{{ name }}</component>
      <b-badge v-if="version" variant="primary ml-1">{{ version }}</b-badge>
      <b-badge v-if="!isCore" variant="dark ml-1">{{ $t('source.extension') }}</b-badge>
    </b-card-header>
    <b-list-group flush>
      <template v-if="errors.length > 0">
        <b-list-group-item v-for="(error, i) in localizedErrors" :key="i" variant="danger">
          {{ makeAjvErrorMessage(error) }}
        </b-list-group-item>
      </template>
      <template v-if="hasWarnings">
        <b-list-group-item v-for="(warning, i) in warnings" :key="i" variant="warning">
          {{ makeAjvErrorMessage(warning) }}
        </b-list-group-item>
      </template>
      <b-list-group-item v-if="errors.length === 0 && !hasWarnings" variant="success">
        {{ $t('source.valid') }}
      </b-list-group-item>
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
    warnings: {
      type: Array,
      default: null
    },
    locale: {
      type: Function,
      default: null
    },
    context: {
      type: Object,
      required: true
    }
  },
  computed: {
    titleComponent() {
      return this.isCore ? 'span': 'code';
    },
    localizedErrors() {
      if (typeof this.locale !== 'function') {
        return this.errors;
      }
      this.locale(this.errors);
      return this.errors;
    },
    hasWarnings() {
      return Array.isArray(this.warnings) && this.warnings.length > 0;
    },
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
        .replace(/(\.github\.io|raw\.githubusercontent\.com)\/?/, '')
        .replace(/\/json-schema/, '')
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
            let localizedLabel;
            const labelKey = `source.validationParams.${key}`;
            if (this.$te(labelKey)) {
              localizedLabel = this.$t(labelKey);
            }
            else {
              localizedLabel = key.replace(/([^A-Z]+)([A-Z])/g, "$1 $2").toLowerCase();
            }

            return `${localizedLabel}: ${value}`;
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
