<template>
  <div class="queryable-group">
    <div class="queryable-row">
      <b-button class="delete" size="md" variant="outline-danger" @click="$emit('remove-queryable')">
        <b-icon-trash aria-hidden="true" />
      </b-button>

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
      <div v-else-if="queryable.isTemporal && operator.SYMBOL === 'in'" class="value dates">
        <div v-for="(date, index) in listValues" :key="index" class="date-row">
          <VueDatePicker
            :model-value="date"
            @update:model-value="updateTemporalValue(index, $event)"
            v-bind="datepickerProps"
            :input-attrs="{ clearable: false }"
          />
          <b-button
            v-if="listValues.length > 1"
            size="md" variant="link" class="remove-date"
            :aria-label="$t('search.removeDate')"
            @click="removeTemporalValue(index)"
          >
            <b-icon-trash aria-hidden="true" />
          </b-button>
        </div>
        <b-button
          size="sm" variant="outline-primary" class="add-date"
          @click="addTemporalValue"
        >
          <b-icon-plus aria-hidden="true" /> {{ $t('search.addDate') }}
        </b-button>
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
        v-else-if="queryable.isTemporal && operator.SYMBOL !== 'like'"
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue"
        v-bind="datepickerProps"
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
    </div>

    <div v-if="queryable.description || operator.description" class="queryable-help text-body-secondary small">
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
    datepickerProps() {
      return {
        locale: this.datepickerLang,
        weekStart: this.weekStartDay,
        formats: { input: this.queryable.isDateTime ? this.dateTimeFormat : this.dateFormat },
        closeOnScroll: false,
        timeConfig: {
          enableTimePicker: this.queryable.isDateTime,
          seconds: this.queryable.isDateTime,
          timePickerInline: true
        },
        inputAttrs: { clearable: true },
        autoApply: true
      };
    },
    listValues() {
      return this.value?.value || [];
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
        this.emitValue(this.defaultValueFor(op));
      }
      this.$emit('update:operator', op);
      this.operatorsOpen = false;
    },
    defaultValueFor(op) {
      if (this.queryable.isTemporal && op.SYMBOL === 'in') {
        // Start with one datepicker: an empty IN list has no cql2-text form
        return CqlValue.create([this.queryable.defaultValue]);
      }
      return op.getDefaultValue(this.queryable);
    },
    updateNegate(negate) {
      this.$emit('update:negate', negate);
    },
    addTemporalValue() {
      this.updateValue([...this.listValues, this.queryable.defaultValue]);
    },
    updateTemporalValue(index, date) {
      if (!(date instanceof Date)) {
        return;
      }
      const dates = this.listValues.slice(0);
      dates[index] = date;
      this.updateValue(dates);
    },
    removeTemporalValue(index) {
      // The cql2-text grammar requires at least one value in an IN list
      if (this.listValues.length < 2) {
        return;
      }
      const dates = this.listValues.slice(0);
      dates.splice(index, 1);
      this.updateValue(dates);
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
  align-items: center;
  display: flex;

  .title, .value {
    flex-grow: 4;
    width: 7rem !important;
  }
  .value.between {
    display: flex;
    gap: 0.2em;
  }
  .value.dates {
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    border-left: 2px solid var(--bs-border-color);
    padding-left: 0.5em;

    .date-row {
      display: flex;
      align-items: center;
      gap: 0.1em;

      .dp__main {
        flex: 1;
        min-width: 0;
      }
    }
    // Keep the destructive red for the button that removes the whole filter
    .remove-date {
      flex: none;
      padding: 0 0.2rem;
      color: var(--bs-text-color);

      &:hover, &:focus-visible {
        color: var(--bs-danger);
      }
    }
    .add-date {
      align-self: flex-start;
    }
  }
  .op {
    min-width: 4rem;
    width: auto;
  }
  .delete {
    padding: 0.2rem 0.3rem;
    border: 0;
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
  margin: 0.5em 0 1em 0;
  line-height: 1.1em;
}

.queryable-group {
  margin: 1rem 0;
}
</style>
