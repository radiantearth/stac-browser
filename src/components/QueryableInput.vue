<template>
  <div class="queryable-group">
    <b-row class="queryable-row">
      <span class="title">
        {{ queryable.title }}
      </span>

      <b-dropdown size="sm" class="op" variant="dark" :text="operator.label">
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

      <b-form-select
        v-if="queryable.isSelection"
        :options="queryableOptions"
        size="sm"
        class="value"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />
      <b-form-input
        v-else-if="queryable.isText"
        size="sm"
        class="value"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />
      <b-form-input
        v-else-if="queryable.isNumeric"
        number
        type="number"
        size="sm"
        class="value"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />
      <date-picker
        v-else-if="queryable.isTemporal"
        type="datetime"
        class="value"
        :lang="datepickerLang"
        :format="datepickerFormat"
        :value="value.value"
        @input="updateValue($event)"
        v-bind="validation"
      />

      <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
        <b-icon-x-circle-fill aria-hidden="true" />
      </b-button>
    </b-row>

    <b-row v-if="queryable.help || operator.description" class="queryable-help text-muted small">
      <Description v-if="queryable.help" :description="queryable.help" inline />
      <Description v-if="operator.description" :description="operator.description" inline />
    </b-row>
  </div>
</template>

<script>
import { BBadge, BDropdown, BDropdownItemButton, BFormInput, BFormSelect, BIconXCircleFill } from 'bootstrap-vue';

import DatePickerMixin from './DatePickerMixin';
import Utils from '../utils';
import CqlValue from '../models/cql2/value';
    
export default {
  name: 'QueryableInput',
  components: {
    BBadge, 
    BDropdown,
    BDropdownItemButton,
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
      if (this.queryableType === 'text') {
        return {
          minlength: this.schema.minLength,
          maxlength: this.schema.maxLenggth,
          required: this.schema.minLength > 0
        };
      }
      else if (this.queryableType === 'number') {
        return {
          min: this.schema.minimum,
          max: this.schema.maximum
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
        this.queryable.schema.enum.map(option => ({
          value: option,
          text: option
        }));
      }
      return [];
    }
  },
  methods: {
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

.queryable-help {
  display: block;
  margin: 0.25em 0 1em 0;
  line-height: 1.1em;
}

.queryable-group {
  margin: 0.75em 0;
}
</style>