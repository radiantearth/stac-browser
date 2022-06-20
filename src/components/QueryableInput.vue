<template>
  <b-row class="queryableRow">
    <span class="title">
      {{ queryable.queryable.titleOrId }}
    </span>

    <b-form-select
      v-if="operatorOptions !== null"
      class="op"
      v-model="queryable.operator"
      size="sm"
      :options="operatorOptions" 
    />     

    <b-form-input
      v-if="queryableType === 'textField'"
      size="sm"
      class="value"
      v-model="queryable.value"
    />
    <b-form-input
      v-else-if="queryableType === 'numberField'"
      type="number"
      size="sm"
      class="value"
      v-model="queryable.value"
    />
    <b-form-select
      v-else-if="queryableType === 'selectField'"
      :options="queryableOptions"
      size="sm"
      class="value"
      v-model="queryable.value"
    />

    <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable', queryableIndex)">
      <b-icon icon="x-circle-fill" aria-hidden="true" />
    </b-button>
  </b-row>
</template>

<script>

import { BFormInput, BFormSelect, BIcon, BIconXCircleFill } from 'bootstrap-vue';
    
export default {
  name: 'QueryableInput',
  components: {
     BFormInput,
     BFormSelect,
     BIcon,
     BIconXCircleFill //eslint-disable-line
  },
  props: {
    queryable: {
      type: Object,
      default () {
        return {};
      }
    },
    queryableIndex: {
      type: Number,
      default: null
    },
  },
  emits: ['remove-queryable'],
  computed: {
    queryableDefinition () {
      return this.queryable.queryable.usableDefinition;
    },
    queryableType () {
      if (this.queryableDefinition.type === 'number' || this.queryableDefinition.type === 'integer') return 'numberField';
      else if ('enum' in this.queryableDefinition) return 'selectField';
      else if (this.queryableDefinition.type === 'string') return 'textField';
      return null;
    },
    operatorOptions () {
      const LESS_THAN = {text: 'Less Than', value: '<'};
      const MORE_THAN = {text: 'More Than', value: '>'};
      const EQUALS = {text: 'Equals', value: '='};
      const NOT_EQUALS = {text: 'Not Equals', value: '<>'};
      const LIKE = {text: 'Like', value: 'LIKE'};

      if (this.queryableType === 'numberField') return [LESS_THAN, MORE_THAN];
      else if (this.queryableType === 'textField') return [EQUALS, NOT_EQUALS, LIKE];
      else if (this.queryableType === 'selectField') return [EQUALS, NOT_EQUALS];
      return null;
    },
    queryableOptions () {
      if (this.queryableType !== 'selectField') return [];
      else {
        return this.queryableDefinition.enum.map((option) => {
          if (typeof option === 'string') {
            return {
              value: option,
              text: option
            };
          } else {
            return option;
          }
        });
      }
    },
    selectedOperator () {
      if (this.operatorOptions === null) return null;
      return this.operatorOptions.find(o => o.value === this.queryable.operator);
    }
  },
  mounted () {
    if (this.queryable.operator === null) this.queryableVisible = true;
    if (this.queryable.operator === null) this.queryable.operator = this.operatorOptions[0].value;
    if (this.queryable.value === null) this.queryable.value = this.calculateDefaultValue();
  },
  methods: {
    setOperator (e) {
      this.queryable.operator = e.target.value;
    },
    calculateDefaultValue () {
      if (this.queryableType === 'textField') return '';
      else if (this.queryableType === 'numberField') {
        if (this.queryableDefinition.minimum) {
         return this.queryableDefinition.minimum;
        }
        return 0;
      } else if (this.queryableType === 'selectField') {
        return this.queryableOptions[0].value;
      }
    }
  }
};
</script>

<style lang="scss">

.queryableRow {
  margin: 0;
  gap: 0.5em;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
}

.op {
  width: 8rem;
}
.delete {
  width: auto;
}
.title, .value {
  flex-grow: 4;
  width: auto;
}

</style>