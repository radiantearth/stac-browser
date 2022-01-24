<template>
  <section class="filter mb-4">
    <h4 v-if="title">{{ title }}</h4>
    <b-form @submit.stop.prevent="onSubmit" @reset="onReset">
      <b-form-group label="Temporal Extent" label-for="datetime">
        <date-picker id="datetime" :value="filters.datetime" @input="setDateTime" range input-class="form-control mx-input"></date-picker>
      </b-form-group>

      <b-form-group label="Spatial Extent" label-for="provideBBox">
        <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">Filter by spatial extent</b-form-checkbox>
        <Map v-if="provideBBox" :stac="stac" :selectBounds="true" @bounds="setBBox" />
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Collections" label-for="collections">
        <b-form-tags input-id="collections" :value="filters.collections" @input="setCollections" separator=" ,;" remove-on-delete add-on-change placeholder="List one or multiple collections..."></b-form-tags>
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Item IDs" label-for="ids">
        <b-form-tags input-id="ids" :value="filters.ids" @input="setIds" separator=" ,;" remove-on-delete add-on-change placeholder="List one or multiple Item IDs..."></b-form-tags>
      </b-form-group>

      <b-form-group label="Limit" label-for="limit" :description="`Number of items requested per page, max ${maxItems} items.`">
        <b-form-input id="limit" :value="filters.limit" @change="setLimit" min="1" :max="maxItems" type="number" :placeholder="`Default (${itemsPerPage})`"></b-form-input>
      </b-form-group>

      <b-button type="submit" variant="primary">Filter</b-button>
      <b-button type="reset" variant="danger" class="ml-3">Reset</b-button>
    </b-form>
  </section>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BFormCheckbox, BFormTags } from 'bootstrap-vue';
import DatePicker from 'vue2-datepicker';
import { mapState } from "vuex";

export default {
  name: 'ItemFilter',
  components: {
    BForm,
    BFormGroup,
    BFormInput,
    BFormCheckbox,
    BFormTags,
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
    },
    title: {
      type: String,
      default: 'Filter'
    },
    collectionOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      maxItems: 10000,
      provideBBox: false,
      filters: this.getDefaultValues()
    };
  },
  computed: {
    ...mapState(['itemsPerPage']),
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        let filters = Object.assign({}, this.getDefaultValues(), value);
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
    getDefaultValues() {
      return {
        datetime: null,
        bbox: null,
        limit: null,
        ids: [],
        collections: []
      };
    },
    onSubmit() {
      this.$emit('input', this.filters, false);
    },
    onReset() {
      this.filters = this.getDefaultValues();
      this.$emit('input', this.filters, true);
    },
    setLimit(limit) {
      limit = Number.parseInt(limit, 10);
      if (limit > this.maxItems) {
        this.filters.limit = this.maxItems;
      }
      else if (limit > 0) {
        this.filters.limit = limit;
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
    },
    setCollections(collections) {
      this.filters.collections = collections;
    },
    setIds(ids) {
      this.filters.ids = ids;
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