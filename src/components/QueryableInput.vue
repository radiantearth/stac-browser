<template>
  <div class="queryable-group">
    <b-row class="queryable-row">
      <span class="title">
        {{ queryable.title }}
      </span>

      <b-dropdown size="sm" class="op" variant="dark" split :text="operator.label" @click="iterateOps">
        <b-dropdown-item-button
          v-for="op in operators"
          :key="op.SYMBOL"
          :active="op === operator"
          @click="updateOperator(op)"
        >
          {{ op.longLabel }}
          <b-badge variant="dark" class="ml-2">{{ op.label }}</b-badge>
        </b-dropdown-item-button>
      </b-dropdown>
      
      <date-picker
        v-if="queryable.isTemporal"
        type="date"
        class="value"
        :lang="datepickerLang"
        :format="datepickerFormat"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />

      <b-form-select
        v-else-if="queryable.isSelection"
        :options="queryableOptions"
        size="sm"
        class="value"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />
      <b-form-input
        v-else-if="queryable.isText || queryable.isNumeric"
        size="sm"
        class="value"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />
      <b-form-checkbox
        v-else-if="queryable.isBoolean"
        switch
        class="value"
        :checked="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      >
        {{ $t(`checkbox.${value.value}`) }}
      </b-form-checkbox>

      <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
        <b-icon-x-circle-fill aria-hidden="true" />
      </b-button>
    </b-row>

    <b-row v-if="queryable.description || operator.description" class="queryable-help text-muted small">
      <Description v-if="operator.description" :description="operator.description" inline />
      <Description v-if="queryable.description" :description="queryable.description" inline />
    </b-row>
  </div>
</template>

<script>
import { BBadge, BDropdown, BDropdownItemButton, BFormCheckbox, BFormInput, BFormSelect, BIconXCircleFill } from 'bootstrap-vue';

import DatePickerMixin from './DatePickerMixin';
import Utils from '../utils';
import CqlValue from '../models/cql2/value';
    
export default {
  name: 'QueryableInput',
  components: {
    BBadge, 
    BDropdown,
    BDropdownItemButton,
    BFormCheckbox,
    BFormInput,
    BFormSelect,
    BIconXCircleFill,
    Description: () => import('./Description.vue')
  },
  mixins: [
    DatePickerMixin
  ],
  props: {
    // eslint-disable-next-line
    value: {
      // Any type is allowed
    },
    operator: {
      type: Function,
      required: true
    },
    queryable: {
      type: Object,
      required: true
    },
    cql: {
      type: Object,
      required: true
    }
  },
  computed: {
    validation() {
      if (this.queryable.isText && !this.queryable.isTemporal) {
        return {
          type: 'text',
          minlength: this.schema.minLength,
          maxlength: this.schema.maxLenggth,
          required: this.schema.minLength > 0
        };
      }
      else if (this.queryable.isNumeric) {
        return {
          type: 'number',
          number: true,
          min: this.schema.minimum,
          max: this.schema.maximum,
          step: this.schema.multipleOf || 'any'
        };
      }
      return {};
    },
    schema() {
      return this.queryable.schema;
    },
    operators() {
      return this.queryable.getOperators(this.cql);
    },
    queryableOptions() {
      if (this.queryable.isSelection) {
        return this.schema.enum.map(option => ({
          value: option,
          text: option
        }));
      }
      return [];
    }
  },
  methods: {
    iterateOps() {
      let findIndex = this.operators.findIndex(op => op === this.operator);
      let nextIndex = ++findIndex % this.operators.length;
      this.updateOperator(this.operators[nextIndex]);
    },
    updateValue(evt) {
      let val = Utils.isObject(evt) && 'target' in evt ? evt.target.value : evt;
      if (typeof val === "string" && this.queryable.is('integer')) {
        val = parseInt(val, 10);
      }
      else if (typeof val === "string" && this.queryable.is('number')) {
        val = parseFloat(val);
      }
      this.$emit('update:value', CqlValue.create(val));
    },
    updateOperator(op) {
      this.$emit('update:operator', op);
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

  .delete {
    width: auto;
  }
  .title, .value {
    flex-grow: 4;
    width: 8rem !important;
  }
}

.op {
  min-width: 4rem;
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
