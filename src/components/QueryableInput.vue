<template>
  <div class="queryable-group">
    <b-row class="queryable-row">
      <span class="title">
        {{ title }}
      </span>

      <b-form-select
        v-if="operatorOptions !== null"
        size="sm"
        class="op"
        :value="operator"
        @input="updateOperator($event)"
        :options="operatorOptions" 
      />

      <b-form-select
        v-if="queryableType === 'selectField'"
        :options="queryableOptions"
        size="sm"
        class="value"
        :value="value"
        @input="updateValue($event)"
      />
      <b-form-input
        v-else-if="queryableType === 'textField'"
        size="sm"
        class="value"
        :value="value"
        @input="updateValue($event)"
      />
      <b-form-input
        v-else-if="queryableType === 'numberField'"
        number
        type="number"
        size="sm"
        class="value"
        :value="value"
        @input="updateValue($event)"
      />
      <date-picker
        v-else-if="queryableType === 'dateField'"
        type="datetime"
        class="value"
        :value="value"
        @input="updateValue($event)"
      />

      <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
        <b-icon-x-circle-fill aria-hidden="true" />
      </b-button>
    </b-row>

    <b-row v-if="help" class="queryable-help text-muted small">
      <Description :description="help" inline />
    </b-row>
  </div>
</template>

<script>
import Utils from '../utils';
import { BFormInput, BFormSelect, BIconXCircleFill } from 'bootstrap-vue';
    
export default {
  name: 'QueryableInput',
  components: {
    BFormInput,
    BFormSelect,
    BIconXCircleFill,
    DatePicker: () => import('vue2-datepicker'),
    Description: () => import('./Description.vue')
  },
  props: {
    title: {
      type: String,
      required: true
    },
    // eslint-disable-next-line vue/require-prop-types
    value: {
      // Any type is allowed
      default: null
    },
    operator: {
      type: String,
      default: null
    },
    schema: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    schemaTypes() {
      if (typeof this.schema.type === 'string') {
        return [this.schema.type];
      }
      else if (Array.isArray(this.schema.type)) {
        return this.schema.type;
      }
      return [];
    },
    isNumeric() {
      return this.schemaTypes.includes('number') || this.schemaTypes.includes('integer');
    },
    help() {
      if (this.operator === 'LIKE') {
        return this.$t('search.likeOperatorDescription');
      }
      else if (this.queryableType === 'dateField') {
        return this.$t('search.dateDescription');
      }
      return null;
    },
    queryableType() {
      if ('enum' in this.schema) {
        return 'selectField';
      }
      else if (this.isNumeric) {
        return 'numberField';
      }
      else if (this.schemaTypes.includes('string')) {
        if (this.schema.format === 'date-time') {
          return 'dateField';
        }
        else {
          return 'textField';
        }
      }
      return null;
    },
    operatorOptions() {
      const LESS_THAN = {text: this.$t('search.lessThan'), value: '<'};
      const MORE_THAN = {text: this.$t('search.greaterThan'), value: '>'};
      const EQUALS = {text: this.$t('search.equalTo'), value: '='};
      const NOT_EQUALS = {text: this.$t('search.notEqualTo'), value: '<>'};
      const LIKE = {text: this.$t('search.matches'), value: 'LIKE'};

      if (this.isNumeric || this.queryableType === 'dateField') {
        return [LESS_THAN, MORE_THAN, EQUALS, NOT_EQUALS];
        }
      else if (this.queryableType === 'textField') {
        return [EQUALS, NOT_EQUALS, LIKE];
      }
      else {
        return [EQUALS, NOT_EQUALS];
      }
    },
    queryableOptions() {
      if (this.queryableType !== 'selectField') {
        return [];
      }
      else {
        return this.schema.enum.map((option) => {
          if (typeof option === 'string') {
            return {
              value: option,
              text: option
            };
          }
          else {
            return option;
          }
        });
      }
    },
    selectedOperator() {
      if (this.operatorOptions === null) {
        return null;
      }
      return this.operatorOptions.find(o => o.value === this.operator);
    }
  },
  mounted() {
    if (this.operator === null) {
      this.queryableVisible = true;
    }
    if (this.operator === null) {
      this.updateOperator(this.operatorOptions[0].value);
    }
    if (this.value === null) {
      this.updateValue(this.calculateDefaultValue());
    }
  },
  methods: {
    updateValue(evt) {
      let val = Utils.isObject(evt) && 'target' in evt ? evt.target.value : evt;
      this.$emit('update:value', val);
    },
    updateOperator(evt) {
      let val = Utils.isObject(evt) && 'target' in evt ? evt.target.value : evt;
      this.$emit('update:operator', val);
    },
    calculateDefaultValue() {
      if (typeof this.schema.default !== 'undefined') {
        return this.schema.default;
      }
      else if (this.queryableType === 'textField') {
        return '';
      }
      else if (this.queryableType === 'dateField') {
        return new Date();
      }
      else if (this.queryableType === 'numberField') {
        if (typeof this.schema.minimum !== 'undefined') {
         return this.schema.minimum;
        }
        return 0;
      }
      else if (this.queryableType === 'selectField') {
        return this.queryableOptions[0].value;
      }
    }
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

.queryable-row {
  margin: 0.25em 0;
  gap: 0.5em;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;

  .op {
    width: 8rem;
  }
  .delete {
    width: auto;
  }
  .title, .value {
    flex-grow: 4;
    width: 8rem !important;
  }
}

.queryable-help {
  display: block;
  margin: 0.25em 0 1em 0;
  line-height: 1.1em;
}

.queryable-group {
  margin: 0.75em 0;
}
</style>