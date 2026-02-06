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
          button-class="d-flex justify-content-between align-items-center"
        >
          <span>{{ op.longLabel }}</span>
          <b-badge variant="dark" class="ml-2">{{ op.label }}</b-badge>
        </b-dropdown-item-button>
      </b-dropdown>

      <b-form-input
        size="sm"
        class="value"
        :value="displayValue"
        @input="onValueInput"
        @blur="onValueBlur"
        :placeholder="placeholder"
        :state="validationState"
        trim
      />

      <b-button class="delete" size="sm" variant="danger" @click="$emit('remove-queryable')">
        <b-icon-x-circle-fill aria-hidden="true" />
      </b-button>
    </b-row>

    <b-row v-if="queryable.description || operator.description" class="queryable-help text-muted small">
      <Description v-if="operator.description" :description="operator.description" inline />
      <Description v-if="queryable.description" :description="queryable.description" inline />
    </b-row>

    <b-row v-if="validationErrors.length > 0" class="queryable-help text-danger small">
      <b-col>
        {{ validationFeedback }}
      </b-col>
    </b-row>

    <b-row v-if="validationWarnings.length > 0" class="queryable-help text-warning small">
      <b-col>
        {{ warningFeedback }}
      </b-col>
    </b-row>
  </div>
</template>

<script>
/**
 * ArrayFilterInput Component
 * 
 * Handles input for array-type queryables in CQL2 filtering.
 * Supports comma-separated input and validates for duplicates and empty values.
 */

import { BBadge, BButton, BCol, BDropdown, BDropdownItemButton, BFormInput, BIconXCircleFill, BRow } from 'bootstrap-vue';
import Description from './Description.vue';
import CqlValue from '../models/cql2/value';

export default {
  name: 'ArrayFilterInput',
  
  components: {
    BBadge,
    BButton,
    BCol,
    BDropdown,
    BDropdownItemButton,
    BFormInput,
    BIconXCircleFill,
    BRow,
    Description
  },
  
  props: {
    /**
     * Current value (CqlValue wrapping an array of strings)
     */
    value: {
      type: Object,
      required: true
    },
    
    /**
     * Current operator class (CqlArrayOperator subclass)
     * Note: This is the class itself, not an instance
     */
    operator: {
      type: Function,
      required: true
    },
    
    /**
     * Available operators for this queryable
     */
    operators: {
      type: Array,
      required: true
    },
    
    /**
     * The queryable being filtered
     */
    queryable: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      /**
       * Current validation errors (empty = valid)
       */
      validationErrors: [],
      /**
       * Current validation warnings (duplicates)
       */
      validationWarnings: []
    };
  },
  
  computed: {
    /**
     * Description of current operator
     */
    operatorDescription() {
      return this.operator?.description || '';
    },
    
    /**
     * Display value (comma-separated string)
     */
    displayValue() {
      const arr = this.value?.value || [];
      if (!arr || arr.length === 0) {
        return '';
      }
      return arr.join(', ');
    },
    
    /**
     * Input placeholder text
     */
    placeholder() {
      return this.$t('arrayFilterInput.helpText');
    },
    
    /**
     * Validation state for Bootstrap form
     */
    validationState() {
      const arr = this.value?.value || [];
      // Invalid if there are validation errors
      if (this.validationErrors.length > 0) {
        return false; // Invalid
      }
      // Valid if array has items and no errors
      if (arr && arr.length > 0) {
        return true; // Valid
      }
      // Neutral if no input yet (empty but not yet validated)
      return null;
    },
    
    /**
     * Validation feedback message
     */
    validationFeedback() {
      if (this.validationErrors.length === 0) {
        return '';
      }
      
      // Show first few errors
      const maxShow = 3;
      const errors = this.validationErrors.slice(0, maxShow);
      let message = errors.join('; ');
      
      if (this.validationErrors.length > maxShow) {
        message += this.$t('arrayFilterInput.andMoreErrors', {
          count: this.validationErrors.length - maxShow
        });
      }
      
      return message;
    },
    
    /**
     * Warning feedback message
     */
    warningFeedback() {
        if (this.validationWarnings.length === 0) {
            return '';
        }
        
        // Show first few warnings
        const maxShow = 3;
        const warnings = this.validationWarnings.slice(0, maxShow);
        let message = warnings.join('; ');
        
        if (this.validationWarnings.length > maxShow) {
            message += this.$t('arrayFilterInput.andMoreErrors', {
                count: this.validationWarnings.length - maxShow
            });
        }
        
        return message;
    }
  },
  
  created() {
    // Run initial validation when component is created
    const arr = this.value?.value || [];
    this.validate(arr);
  },
  
  methods: {
    /**
     * Iterate through operators (cycle to next on click)
     */
    iterateOps() {
      let findIndex = this.operators.findIndex(op => op === this.operator);
      let nextIndex = ++findIndex % this.operators.length;
      this.updateOperator(this.operators[nextIndex]);
    },
    
    /**
     * Update operator
     */
    updateOperator(op) {
      this.$emit('update:operator', op);
    },
    
    /**
     * Handle value input (real-time)
     */
    onValueInput(inputString) {
      // Parse comma-separated input
      const parsed = this.parseInput(inputString);
      
      // Validate
      this.validate(parsed);
      
      // Emit update wrapped in CqlValue (even if invalid, so parent can track state)
      this.$emit('update:value', CqlValue.create(parsed));
    },
    
    /**
     * Handle value blur (focus lost)
     */
    onValueBlur() {
      // Optionally, could perform additional validation or cleanup here
    },
    
    /**
     * Parse comma-separated input into array
     */
    parseInput(inputString) {
      if (!inputString || inputString.trim() === '') {
        return [];
      }
      
      // Split by comma, trim whitespace, filter empty
      return inputString
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '');
    },
    
    /**
     * Validate array of values
     */
    validate(values) {
      const errors = [];
      const warnings = [];
      
      // Check for empty array
      if (!values || values.length === 0) {
        errors.push(this.$t('arrayFilterInput.required'));
      }
      
      // Check for duplicates
      const seen = new Set();
      const duplicates = [];
      
      values.forEach((value) => {
        if (seen.has(value)) {
          duplicates.push(value);
        } else {
          seen.add(value);
        }
      });
      
      // Report duplicates (consolidated)
      const uniqueDuplicates = [...new Set(duplicates)];
      if (uniqueDuplicates.length > 0) {
        const limit = 5;
        const shown = uniqueDuplicates.slice(0, limit).map(v => this.truncate(v));
        let valuesParam = shown.join(', ');
        
        if (uniqueDuplicates.length > limit) {
           valuesParam += ', ...';
        }
        
        warnings.push(
          this.$t('arrayFilterInput.duplicates', { values: valuesParam })
        );
      }
      
      this.validationErrors = errors;
      this.validationWarnings = warnings;
    },
    
    /**
     * Truncate long strings for display in error messages
     */
    truncate(str, maxLength = 20) {
      if (str.length <= maxLength) {
        return str;
      }
      return str.substring(0, maxLength) + '...';
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
