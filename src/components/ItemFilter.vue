<template>
  <section class="filter mb-4">
    <h4 v-if="title">{{ title }}</h4>
    <b-form @submit.stop.prevent="onSubmit" @reset="onReset">
      <b-form-group label="Temporal Extent" label-for="datetime">
        <date-picker id="datetime" :value="filters.datetime" @input="setDateTime" range input-class="form-control mx-input" />
      </b-form-group>

      <b-form-group label="Spatial Extent" label-for="provideBBox">
        <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">Filter by spatial extent</b-form-checkbox>
        <Map class="mb-4" v-if="provideBBox" :stac="stac" :selectBounds="true" @bounds="setBBox" />
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Collections" label-for="collections">
        <b-form-tags
          input-id="collections" :value="filters.collections" @input="setCollections" separator=" ,;"
          remove-on-delete add-on-change
          placeholder="List one or multiple collections..."
        />
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Item IDs" label-for="ids">
        <b-form-tags
          input-id="ids" :value="filters.ids" @input="setIds" separator=" ,;"
          remove-on-delete add-on-change
          placeholder="List one or multiple Item IDs..."
        />
      </b-form-group>

      <b-form-group v-if="sort" label="Sort" label-for="sort" description="Some APIs may not support all of the options.">
        <b-form-select id="sort" :value="sortTerm" :options="sortOptions" placeholder="Default" @input="sortFieldSet" />
        <SortButtons v-if="sortTerm" class="mt-1" :value="sortOrder" enforce @input="sortDirectionSet" />
      </b-form-group>

      <b-form-group label="Items per page" label-for="limit" :description="`Number of items requested per page, max. ${maxItems} items.`">
        <b-form-input
          id="limit" :value="filters.limit" @change="setLimit" min="1"
          :max="maxItems" type="number"
          :placeholder="`Default (${itemsPerPage})`"
        />
      </b-form-group>

      <div class="additionalFilters" v-if="itemSearch && itemSearch.filterFragment.hasQueryableFields">
        <b-form-group label="Additional filters" label-for="availableFields">
          <b-dropdown size="sm" text="Add filter" block variant="primary" class="mt-2 mb-3" menu-class="w-100">
            <b-dropdown-item v-for="option in fieldFilterOptions" :key="option.text" @click="additionalFieldSelected(option)">{{ option.text }}</b-dropdown-item>
          </b-dropdown>

          <b-row v-for="item in userDefinedFilters" :key="item.queryable.uniqueId" class="mb-2">
            <span class="title">
              {{ item.queryable.usableDefinition.title }}
            </span>
            <b-form-select v-if="item.operator !== null" class="op" v-model="item.operator" size="sm" :options="item.queryable.operatorOptions" />     
            <component class="value" :is="item.component" v-bind="item.props" @input="queryableSet(item, $event)" />
            <b-button class="delete" size="sm" variant="danger" @click="removeUserFilterField(item)">
              <b-icon icon="x-circle-fill" aria-hidden="true" />
            </b-button>
          </b-row>
        </b-form-group>
      </div>

      <div class="mt-3">
        <b-button type="submit" variant="primary">Filter</b-button>
        <b-button type="reset" variant="danger" class="ml-3">Reset</b-button>
      </div>
    </b-form>
  </section>
</template>

<script>
import { BDropdown, BDropdownItem, BForm, BFormGroup, BFormInput, BFormCheckbox, BFormSelect, BFormSelectOption, BFormTags, BButton, BIcon, BIconXCircleFill } from 'bootstrap-vue';

import DatePicker from 'vue2-datepicker';
import { mapState } from "vuex";
import ItemSearch from '../models/ItemSearch';

export default {
  name: 'ItemFilter',
  components: {
    BDropdown,
    BDropdownItem,
    BForm,
    BFormGroup,
    BFormInput,
    BFormCheckbox,
    BFormSelect,
    BFormSelectOption,
    BFormTags,
    BButton,
    BIcon,
    BIconXCircleFill,
    DatePicker,
    Map: () => import('./Map.vue'),
    SortButtons: () => import('./SortButtons.vue')
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
    sort: {
      type: Boolean,
      default: false
    },
    collectionOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      itemSearch: null,
      sortOrder: 1,
      sortTerm: null,
      sortOptions: [
        { value: null, text: 'Default' },
        { value: 'properties.datetime', text: 'Date and Time' },
        { value: 'id', text: 'ID' },
        { value: 'properties.title', text: 'Title' }
      ],
      maxItems: 10000,
      provideBBox: false,
      filters: this.getDefaultValues()
    };
  },
  computed: {
    ...mapState(['itemsPerPage']),
    fieldFilterOptions () {
      if (this.itemSearch === null) return [];
      return this.itemSearch.filterFragment.queryables.map(q => {
          return { value: q.id, text: q.usableDefinition.title };
      });
    },
    userDefinedFilters () {
      if (this.itemSearch === null) return [];
      return this.itemSearch.filterFragment.queryableInputs;
    }
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
   mounted () {
    this.createBlankSearchFilter();
  },
  methods: {
    sortFieldSet (value) {
      this.sortTerm = value;
      this.queryableSet(this.itemSearch.sortFragment.queryable, value);
    },
    sortDirectionSet (value) {
      this.sortOrder = value;
      this.itemSearch.sortFragment.direction = this.sortOrder < 0 ? '-' : '';
    },
    queryableSet (item, event) {
      item.props.value = event;
    },
    removeUserFilterField (item) {
      this.itemSearch.filterFragment.removeQueryableInput(item);
    },
    additionalFieldSelected (selected) {
      const queryable = this.itemSearch.filterFragment.queryables.find(q => q.id === selected.value);
      this.itemSearch.filterFragment.createQueryableInput(queryable);
    },
    getDefaultValues() {
      return {
        datetime: null,
        bbox: null,
        limit: null,
        ids: [],
        collections: [],
        sortby: null,
        advancedFilters: null
      };
    },
    onSubmit() {
      if (this.sort) {
        this.filters.sortby = this.formatSort();
      }
      this.filters.advancedFilters = this.itemSearch.getAsCql2Json();
      this.$emit('input', this.filters, false);
    },
    async onReset() {
      this.filters = this.getDefaultValues();
      await this.createBlankSearchFilter();
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
        this.itemSearch.coreSearchFields.bboxQueryableInput.setValueFromLeafletBounds(bounds);
      } else {
        this.filters.bbox = null;
        this.itemSearch.coreSearchFields.bboxQueryableInput.clearValue();
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

        this.queryableSet(this.itemSearch.coreSearchFields.datetimeQueryableInput, `${datetime[0].toISOString()}/${datetime[1].toISOString()}`);

      }
      else {
        this.filters.datetime = null;
      }
    },
    setCollections(collections) {
      this.filters.collections = collections;
      this.queryableSet(this.itemSearch.coreSearchFields.collectionsQueryableInput, collections);
    },
    setIds(ids) {
      this.filters.ids = ids;
    },
    formatSort() {
      if (this.sort && this.sortTerm) {
        let order = this.sortOrder < 0 ? '-' : '';
        return `${order}${this.sortTerm}`;
      }
      else {
        return null;
      }
    },
    async createBlankSearchFilter() {
      const itemSearch = new ItemSearch();
      await itemSearch.init(this.stac);
      if (this.stac.type === 'Collection') {
        this.queryableSet(itemSearch.coreSearchFields.collectionsQueryableInput, [this.stac.id]);
      }
      this.itemSearch = itemSearch;
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

$default-color: map-get($theme-colors, "secondary");
$primary-color: map-get($theme-colors, "primary");

@import '~vue2-datepicker/scss/index.scss';

.filter {
  .mx-datepicker {
    width: 100%;
  }

  .form-group {
    > div {
      margin-left: 1em;
    }

    > label {
      font-weight: 600;
    }
  }

  .additionalFilters {
    .row {
      margin: 0;
      gap: 0.5em;
      flex-direction: row;
      flex-wrap: nowrap;
      align-content: center;
    }

    .op {
      width: 5rem;
    }
    .delete {
      width: auto;
    }
    .title, .value {
      flex-grow: 5;
      width: auto;
    }
  }
}
</style>