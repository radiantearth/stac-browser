<template>
  <b-card no-body>
    <b-card-header>
      <component :is="titleComponent" class="name me-1" :title="id">{{ name }}</component>
      <b-badge v-if="version" variant="primary ms-1">{{ version }}</b-badge>
      <b-badge v-if="!isCore" variant="dark ms-1">{{ $t('source.extension') }}</b-badge>
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
import { BCard, BCardHeader } from 'bootstrap-vue-next';
import { formatAjvMessage, localizeErrors, schemaTitle, schemaVersion } from '../validation';

export default {
  name: "ValidationResult",
  components: {
    BCard,
    BCardHeader
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
      return localizeErrors(this.errors, this.locale);
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
          return this.$t('stacItem', 1);
        case "Catalog":
          return this.$t(`stacCatalog`, 1);
        case "Collection":
          return this.$t(`stacCollection`, 1);
        default:
          return this.context.type;
      }
    },
    name() {
      if (this.isCore) {
        return this.type;
      }
      return schemaTitle(this.id);
    },
    version() {
      if (this.isCore) {
        return this.context.version;
      }
      return schemaVersion(this.id);
    }
  },
  methods: {
    makeAjvErrorMessage(error) {
      const message = formatAjvMessage(error, this.$t, this.$te);
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
