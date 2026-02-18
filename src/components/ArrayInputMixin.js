import CqlValue from '../models/cql2/value';

export default {
  data() {
    return {
      rawInput: '',
      validationErrors: [],
      validationWarnings: []
    };
  },
  computed: {
    validationState() {
      const arr = this.value?.value || [];
      if (this.validationErrors.length > 0) {
        return false;
      }
      if (arr && arr.length > 0) {
        return true;
      }
      return null;
    },
    validationFeedback() {
      if (this.validationErrors.length === 0) {
        return '';
      }
      const maxShow = 3;
      const errors = this.validationErrors.slice(0, maxShow);
      let message = errors.join('; ');
      if (this.validationErrors.length > maxShow) {
        message += this.$t('multiselect.andMore', {
          count: this.validationErrors.length - maxShow
        });
      }
      return message;
    },
    warningFeedback() {
      if (this.validationWarnings.length === 0) {
        return '';
      }
      const maxShow = 3;
      const warnings = this.validationWarnings.slice(0, maxShow);
      let message = warnings.join('; ');
      if (this.validationWarnings.length > maxShow) {
        message += this.$t('multiselect.andMore', {
          count: this.validationWarnings.length - maxShow
        });
      }
      return message;
    }
  },
  watch: {
    rawInput(newInput) {
      if (!this.queryable?.isArray) {
        return;
      }
      const parsed = this.parseInput(newInput);
      this.validate(parsed);
      this.$emit('update:value', CqlValue.create(parsed));
    },
    value: {
      handler(newValue) {
        if (!this.queryable?.isArray) {
          return;
        }
        const arr = newValue?.value || [];
        const newDisplay = arr.length > 0 ? arr.join(', ') : '';
        if (this.rawInput !== newDisplay) {
           this.rawInput = newDisplay;
        }
      },
      deep: true
    }
  },
  created() {
    if (!this.queryable?.isArray) {
      return;
    }
    const arr = this.value?.value || [];
    this.validate(arr);
    if (arr.length > 0) {
      this.rawInput = arr.join(', ');
    }
  },
  methods: {
    parseInput(inputString) {
      if (!inputString || inputString.trim() === '') {
        return [];
      }
      const itemType = this.queryable?.schema?.items?.type;

      return inputString
        .split(',')
        .map(item => item.trim())
        .filter(item => item !== '')
        .map(item => {
          // Coerce item types based on schema.items.type, similar to QueryableInput.updateValue
          if (itemType === 'integer') {
            const parsed = parseInt(item, 10);
            // Ensure full string is a valid integer representation
            if (!Number.isNaN(parsed) && String(parsed) === item) {
              return parsed;
            }
            return item;
          }

          if (itemType === 'number') {
            const parsed = parseFloat(item);
            if (Number.isFinite(parsed)) {
              return parsed;
            }
            return item;
          }

          if (itemType === 'boolean') {
            const lower = item.toLowerCase();
            if (lower === 'true') {
              return true;
            }
            if (lower === 'false') {
              return false;
            }
            return item;
          }

          // Default: keep as string
          return item;
        });
    },
    validate(values) {
      const errors = [];
      const warnings = [];
      
      if (!values || values.length === 0) {
         errors.push(this.$t('search.arrayInput.required'));
      }
      
      const seen = new Set();
      const duplicates = [];
      values.forEach((value) => {
        if (seen.has(value)) {
          duplicates.push(value);
        } else {
          seen.add(value);
        }
      });
      
      const uniqueDuplicates = [...new Set(duplicates)];
      if (uniqueDuplicates.length > 0) {
        const limit = 5;
        const shown = uniqueDuplicates.slice(0, limit).map(v => this.truncate(v));
        let valuesParam = shown.join(', ');
        if (uniqueDuplicates.length > limit) {
           valuesParam += ', ...';
        }
        warnings.push(
          this.$t('search.arrayInput.duplicates', { values: valuesParam })
        );
      }
      
      this.validationErrors = errors;
      this.validationWarnings = warnings;
    },
    truncate(str, maxLength = 20) {
      if (str.length <= maxLength) {
        return str;
      }
      return str.substring(0, maxLength) + '...';
    }
  }
};
