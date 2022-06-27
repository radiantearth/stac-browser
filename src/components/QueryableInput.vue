<template>
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
      type="number"
      size="sm"
      class="value"
      :value="value"
      @input="updateValue($event)"
    />

    <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
      <b-icon-x-circle-fill aria-hidden="true" />
    </b-button>
  </b-row>
</template>

<script>
import Utils from '../utils';
import { BFormInput, BFormSelect, BIconXCircleFill } from 'bootstrap-vue';
    
export default {
  name: 'QueryableInput',
  components: {
     BFormInput,
     BFormSelect,
     BIconXCircleFill
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
      if (this.schema.type === 'string') {
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
    queryableType() {
      if ('enum' in this.schema) {
        return 'selectField';
      }
      else if (this.isNumeric) {
        return 'numberField';
      }
      else if (this.schemaTypes.includes('string')) {
        return 'textField';
      }
      return null;
    },
    operatorOptions() {
      const LESS_THAN = {text: 'Less Than', value: '<'};
      const MORE_THAN = {text: 'More Than', value: '>'};
      const EQUALS = {text: 'Equals', value: '='};
      const NOT_EQUALS = {text: 'Not Equals', value: '<>'};
      const LIKE = {text: 'Like', value: 'LIKE'};

      if (this.queryableType === 'numberField') {
        return [LESS_THAN, MORE_THAN];
        }
      else if (this.queryableType === 'textField') {
        return [EQUALS, NOT_EQUALS, LIKE];
      }
      else if (this.queryableType === 'selectField') {
        if (this.isNumeric) {
          return [EQUALS, NOT_EQUALS];
        }
        else {
          return [EQUALS, NOT_EQUALS, LESS_THAN, MORE_THAN];
        }
      }
      return null;
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
      if (this.operatorOptions === null) {return null;}
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
      if (this.isNumeric) {
        val = Number.parseFloat(val);
      }
      this.$emit('update:value', val);
    },
    updateOperator(evt) {
      let val = Utils.isObject(evt) && 'target' in evt ? evt.target.value : evt;
      this.$emit('update:operator', val);
    },
    calculateDefaultValue() {
      if (this.queryableType === 'textField') {return '';}
      else if (this.queryableType === 'numberField') {
        if (this.schema.minimum) {
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
    width: 8rem;
  }
}
</style>