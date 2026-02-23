<template>
  <div class="queryable-group">
    <div class="queryable-row">
      <span class="title">
        {{ queryable.title }}
      </span>

      <b-dropdown
        v-model="operatorsOpen"
        split auto-close="outside"
        size="sm" class="op" variant="dark" :text="operator.label"
        @split-click="iterateOps"
      >
        <b-dropdown-item-button
          v-for="op in operators"
          :key="op.SYMBOL"
          :active="op === operator"
          @click="updateOperator(op)"
          button-class="queryable-item"
        >
          <span class="long-label">{{ op.longLabel }}</span>
          <b-badge variant="dark" class="ms-2">{{ op.label }}</b-badge>
        </b-dropdown-item-button>
        <b-dropdown-divider />
        <b-dropdown-item-button
          button-class="queryable-item"
          :active="negate"
          @click="updateNegate(!negate)"
        >
          <b-icon-check :class="{hide: !negate}" class="mt-1 me-2" />
          <span class="long-label">{{ cqlNot.longLabel }}</span>
          <b-badge variant="dark" class="ms-2">{{ cqlNot.label }}</b-badge>
        </b-dropdown-item-button>
      </b-dropdown>

      <div v-if="operator.SYMBOL === 'between'" class="value between">
        <b-form-input
          :number="queryable.isNumeric"
          :type="queryable.isNumeric ? 'number' : 'text'"
          size="sm"
          :value="value[0].value"
          @input="updateBetweenValue(0, $event)"
          v-bind="validation"
        />
        <span class="sep">-</span>
        <b-form-input
          :number="queryable.isNumeric"
          :type="queryable.isNumeric ? 'number' : 'text'"
          size="sm"
          :value="value[1].value"
          @input="updateBetweenValue(1, $event)"
          v-bind="validation"
        />
      </div>
      <multiselect
        v-else-if="queryable.isArray || operator.SYMBOL === 'in'"
        class="value"
        v-model="arrayValues"
        multiple
        :taggable="!queryable.isSelection"
        :options="queryable.isSelection ? queryableOptions : arrayValues"
        :placeholder="$t('search.arrayInput.helpText')"
        :tag-placeholder="$t('search.arrayInput.addValue')"
        @tag="addArrayValue"
        @paste="onArrayPaste"
      >
        <template #noOptions>{{ $t('search.noOptions') }}</template>
      </multiselect>
      <VueDatePicker
        v-else-if="queryable.isTemporal"
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue"
        :locale="datepickerLang"
        :week-start="weekStartDay"
        :formats="{ input: queryable.isDateTime ? dateTimeFormat : dateFormat }"
        :close-on-scroll="false"
        :time-config="{ 
          enableTimePicker: queryable.isDateTime,
          seconds: queryable.isDateTime,
          timePickerInline: true 
        }"
        :input-attrs="{ clearable: true }"
        auto-apply
      />
      <b-form-select
        v-else-if="queryable.isSelection"
        :options="queryableOptions"
        size="sm"
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue($event)"
      />
      <b-form-input
        v-else-if="queryable.isText || queryable.isNumeric"
        size="sm"
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue($event)"
        v-bind="validation"
      />
      <b-form-checkbox
        v-else-if="queryable.isBoolean"
        switch
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue($event)"
        v-bind="validation"
      >
        {{ $t(`checkbox.${value.value}`) }}
      </b-form-checkbox>

      <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
        <b-icon-x-circle-fill aria-hidden="true" />
      </b-button>
    </div>

    <div v-if="queryable.description || operator.description" class="queryable-help text-muted small">
      <Description v-if="operator.description" :description="operator.description" inline />
      <Description v-if="queryable.description" :description="queryable.description" inline />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import { BDropdownDivider, BDropdown, BDropdownItemButton } from 'bootstrap-vue-next';

import DatePickerMixin from './DatePickerMixin';
import { isObject } from 'stac-js/src/utils.js';
import CqlValue from '../models/cql2/value';
import { CqlNot } from '../models/cql2/operators/logical';
    
export default {
  name: 'QueryableInput',
  components: {
    BDropdownDivider,
    BDropdown,
    BDropdownItemButton,
    Description: defineAsyncComponent(() => import('./Description.vue')),
    Multiselect: defineAsyncComponent(() => import('vue-multiselect'))
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
    negate: {
      type: Boolean,
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
  emits: [
    'remove-queryable',
    'update:value',
    'update:operator',
    'update:negate'
  ],
  data() {
    return {
      operatorsOpen: false,
      cqlNot: CqlNot
    };
  },
  computed: {
    validation() {
      if (this.queryable.isText) {
        return {
          type: 'text',
          minlength: this.schema.minLength,
          maxlength: this.schema.maxLength,
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
        return this.schema.enum;
      }
      return [];
    },
    arrayValues: {
      get() {
        const arr = this.value?.value || [];
        return arr.map(v => String(v));
      },
      set(newValues) {
        this.updateValue(newValues.map(v => this.castArrayItem(v)));
      }
    }
  },
  methods: {
    iterateOps() {
      let findIndex = this.operators.findIndex(op => op === this.operator);
      let nextIndex = ++findIndex % this.operators.length;
      this.updateOperator(this.operators[nextIndex]);
    },
    updateValue(evt) {
      let val = this.getEventValue(evt);
      val = this.castValue(val);
      this.emitValue(CqlValue.create(val));
    },
    emitValue(value) {
      this.$emit('update:value', value);
    },
    updateOperator(op) {
      if (this.operator.valueType !== op.valueType) {
        this.emitValue(op.getDefaultValue(this.queryable));
      }
      this.$emit('update:operator', op);
      this.operatorsOpen = false;
    },
    updateNegate(negate) {
      this.$emit('update:negate', negate);
    },
    addArrayValue(tag) {
      tag = tag.trim();
      if (tag === '') {
        return;
      }
      const value = this.castArrayItem(tag);
      const currentArr = this.value?.value || [];
      this.updateValue([...currentArr, value]);
    },
    onArrayPaste(event) {
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) {
        return;
      }
      const pasted = clipboardData.getData('text');
      if (!pasted || !pasted.includes(',')) {
        return;
      }
      event.preventDefault();
      const currentArr = this.value?.value || [];
      const items = pasted.split(',')
        .map(s => s.trim())
        .filter(s => s !== '')
        .map(s => this.castArrayItem(s))
        .filter(item => !currentArr.includes(item));
      if (items.length > 0) {
        this.updateValue([...currentArr, ...items]);
      }
    },
    castValue(value) {
      if (typeof value !== "string") {
        return value;
      }
      if (this.queryable.is('integer')) {
        value = parseInt(value, 10);
      }
      else if (this.queryable.is('number')) {
        value = parseFloat(value);
      }
      return value;
    },
    castArrayItem(item) {
      const itemTypes = this.queryable.isArray ? this.queryable.arrayItems : this.queryable.types;
      // We only support string, integer and number here
      // We do not support boolean, object and (sub)arrays.
      if (typeof item !== 'string') {
        return item;
      }
      if (itemTypes.includes('string')) {
        if (itemTypes.includes('integer') || itemTypes.includes('number')) {
          // If strings are allowed, but also numbers, we only coerce to number if it looks like a number
          if (itemTypes.includes('integer') && /^-?\d+$/.test(item)) {
            return parseInt(item, 10);
          }
          else if (itemTypes.includes('number') && /^-?\d+(\.\d+)?$/.test(item)) {
            return parseFloat(item);
          }
        }
        return item;
      }
      // Do number first to avoid casting floats to integers if both are allowed
      else if (itemTypes.includes('number')) {
         return parseFloat(item);
      }
      else if (itemTypes.includes('integer')) {
        return parseInt(item, 10);
      }
      return item;
    },
    updateBetweenValue(ix, evt) {
      const value = this.getEventValue(evt);
      const between = this.value.slice(0);
      between[ix] = CqlValue.create(this.castValue(value));
      this.emitValue(between);
    },
    getEventValue(event) {
      return isObject(event) && 'target' in event ? event.target.value : event;
    }
  }
};
</script>

<style lang="scss">
@import 'bootstrap/scss/mixins';
@import "../theme/variables.scss";
@import '../theme/datepicker.scss';

.queryable-row {
  margin: 0.25em 0;
  gap: 0.5em;
  flex-direction: row;
  flex-wrap: nowrap;
  align-content: center;
  display: flex;

  .title, .value {
    flex-grow: 4;
    width: 7rem !important;
  }
  .value.between {
    display: flex;
    gap: 0.2em;
  }
  .op {
    min-width: 4rem;
    width: auto;
  }
  .delete {
    width: auto;
  }
}

.queryable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .long-label {
    flex-grow: 1;
    white-space: nowrap;
  }

  .hide {
    opacity: 0;
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
