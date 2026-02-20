<template>
  <div class="queryable-group">
    <div class="queryable-row">
      <span class="title">
        {{ queryable.title }}
      </span>

      <b-dropdown size="sm" class="op" variant="dark" split :text="operator.label" @click="iterateOps">
        <b-dropdown-item-button
          v-for="op in operators"
          :key="op.SYMBOL"
          :active="op === operator"
          @click="updateOperator(op)"
          button-class="d-flex justify-content-between align-items-center"
        >
          <span>{{ op.longLabel }}</span>
          <b-badge variant="dark" class="ms-2">{{ op.label }}</b-badge>
        </b-dropdown-item-button>
      </b-dropdown>

      <VueDatePicker
        v-if="queryable.isTemporal"
        class="value"
        :model-value="value?.value"
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
        v-bind="validation"
      />
      <b-form-input
        v-else-if="queryable.isText || queryable.isNumeric"
        size="sm"
        class="value"
        :model-value="value.value"
        @update:model-value="updateValue($event)"
        v-bind="validation"
      />
      <multiselect
        v-else-if="queryable.isArray"
        class="value"
        v-model="arrayValues"
        :multiple="true"
        :taggable="true"
        :options="arrayValues"
        :placeholder="$t('search.arrayInput.helpText')"
        :tag-placeholder="$t('search.arrayInput.addValue')"
        @tag="addArrayValue"
        @paste="onArrayPaste"
      >
        <template #noOptions>{{ $t('search.noOptions') }}</template>
      </multiselect>
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

import { BDropdown, BDropdownItemButton } from 'bootstrap-vue-next';

import DatePickerMixin from './DatePickerMixin';
import Utils from '../utils';
import CqlValue from '../models/cql2/value';
    
export default {
  name: 'QueryableInput',
  components: {
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
    'update:operator'
  ],
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
        return this.schema.enum.map(option => ({
          value: option,
          text: option
        }));
      }
      return [];
    },
    arrayValues: {
      get() {
        const arr = this.value?.value || [];
        return arr.map(v => String(v));
      },
      set(newValues) {
        const coerced = newValues.map(v => this.coerceArrayItem(v));
        this.$emit('update:value', CqlValue.create(coerced));
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
    },
    addArrayValue(tag) {
      const coerced = this.coerceArrayItem(tag.trim());
      const currentArr = this.value?.value || [];
      this.$emit('update:value', CqlValue.create([...currentArr, coerced]));
    },
    onArrayPaste(event) {
      const clipboardData = event.clipboardData || window.clipboardData;
      if (!clipboardData) return;
      const pasted = clipboardData.getData('text');
      if (!pasted || !pasted.includes(',')) return;
      event.preventDefault();
      const items = pasted.split(',').map(s => s.trim()).filter(s => s !== '');
      const currentArr = this.value?.value || [];
      const currentSet = new Set(currentArr.map(String));
      const newItems = items
        .filter(item => !currentSet.has(item))
        .map(item => this.coerceArrayItem(item));
      if (newItems.length > 0) {
        this.$emit('update:value', CqlValue.create([...currentArr, ...newItems]));
      }
    },
    coerceArrayItem(item) {
      const itemType = this.queryable?.schema?.items?.type;
      if (itemType === 'integer') {
        const parsed = parseInt(item, 10);
        if (!Number.isNaN(parsed) && String(parsed) === item) {
          return parsed;
        }
      }
      else if (itemType === 'number') {
        const parsed = parseFloat(item);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return item;
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
  .op {
    min-width: 4rem;
    width: auto;
  }
  .delete {
    width: auto;
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
