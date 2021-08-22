<template>
  <section class="filter mb-4">
    <h4>Filter</h4>
    <b-form @submit.stop.prevent="onSubmit" @reset="onReset">
      <b-form-group label="Temporal Extent" label-for="datetime">
        <date-picker id="datetime" :value="filters.datetime" @input="setDateTime" range input-class="form-control mx-input"></date-picker>
      </b-form-group>

      <b-form-group label="Spatial Extent" label-for="provideBBox">
        <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">Filter by spatial extent</b-form-checkbox>
        <Map v-if="provideBBox" :stac="stac" :selectBounds="true" @bounds="setBBox" />
      </b-form-group>

      <b-form-group label="Limit" label-for="limit" description="Number of items requested per page">
        <b-form-input id="limit" :input="filters.limit" @change="setLimit" min="1" max="1000" type="number" placeholder="Default"></b-form-input>
      </b-form-group>

      <b-button type="submit" variant="primary">Filter</b-button>
      <b-button type="reset" variant="danger" class="ml-3">Reset</b-button>
    </b-form>
  </section>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BFormCheckbox } from 'bootstrap-vue';
import DatePicker from 'vue2-datepicker';

const defaultValues = {datetime: null, bbox: null, limit: null};

export default {
  name: 'ItemFilter',
  components: {
    BForm,
    BFormGroup,
    BFormInput,
    BFormCheckbox,
    DatePicker,
    Map: () => import('./Map.vue')
  },
  props: {
    stac: {
      type: Object,
      required: true
    },
    value: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      provideBBox: false,
      filters: {}
    };
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        let filters = Object.assign({}, defaultValues, value);
        // Convert from UTC to locale time (needed for vue2-datetimepicker)
        // see https://github.com/mengxiong10/vue2-datepicker/issues/388
        if (Array.isArray(filters.datetime)) {
          filters.datetime = filters.datetime.map(dt => {
            if (dt instanceof Date) {
              const value = new Date(dt);
              const offset = value.getTimezoneOffset();
              dt = new Date(value.getTime() + offset * 60 * 1000);
            }
            return dt;
          });
        }
        this.filters = filters;
      }
    }
  },
  methods: {
    onSubmit() {
      this.$emit('input', this.filters);
    },
    onReset() {
      this.$emit('input', defaultValues);
    },
    setLimit(limit) {
      if (limit > 0 && limit < 1000) {
        this.filters.limit = Number.parseInt(limit, 10);
      }
      else {
        this.filters.limit = null;
      }
    },
    setBBox(bounds) {
      if (this.provideBBox) {
        this.filters.bbox = bounds;
      }
      else {
        this.filters.bbox = null;
      }
    },
    setDateTime(datetime) {
      if (datetime.find(dt => dt instanceof Date)) {
        datetime = datetime.map(dt => {
          if (dt instanceof Date) {
            // Convert to UTC
            const offset = new Date().getTimezoneOffset();
            return new Date(dt.getTime() - offset * 60 * 1000);
          }
          return dt;
        });
        this.filters.datetime = datetime;
      }
      else {
        this.filters.datetime = null;
      }
    }
  }
}
</script>

<style lang="scss">
@import '../theme/variables.scss';

$default-color: $secondary;
$primary-color: $primary;

@import '~vue2-datepicker/scss/index.scss';

.mx-datepicker {
  width: 100%;
}
</style>