<template>
  <b-form class="filter mb-4" @submit.stop.prevent="onSubmit" @reset="onReset">
    <b-card no-body :title="title">
      <b-card-body>
        <Loading v-if="!loaded" fill />

        <b-form-group v-if="canFilterExtents" label="Temporal Extent" label-for="datetime" description="All times in UTC.">
          <date-picker id="datetime" :value="query.datetime" @input="setDateTime" range input-class="form-control mx-input" />
        </b-form-group>

        <b-form-group v-if="canFilterExtents" label="Spatial Extent" label-for="provideBBox">
          <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">Filter by spatial extent</b-form-checkbox>
          <Map class="mb-4" v-if="provideBBox" :stac="stac" :selectBounds="true" @bounds="setBBox" scrollWheelZoom />
        </b-form-group>

        <b-form-group v-if="!collectionOnly" label="Collections" label-for="collections">
          <b-form-select
            v-if="collections.length > 0"
            id="collections" :value="query.collections" @input="setCollections"
            :options="collections" multiple
          />
          <b-form-tags
            v-else
            input-id="collections" :value="query.collections" @input="setCollections" separator=" ,;"
            remove-on-delete add-on-change
            placeholder="List one or multiple collections..."
          />
        </b-form-group>

        <b-form-group v-if="!collectionOnly" label="Item IDs" label-for="ids">
          <b-form-tags
            input-id="ids" :value="query.ids" @input="setIds" separator=" ,;"
            remove-on-delete add-on-change
            placeholder="List one or multiple Item IDs..."
          />
        </b-form-group>

        <div class="additional-filters" v-if="canFilterCql && Array.isArray(queryables) && queryables.length > 0">
          <b-form-group label="Additional filters" label-for="availableFields">
            <b-alert variant="warning" show>This feature is still experimental and may give unexpected results!</b-alert>

            <b-dropdown size="sm" text="Add filter" block variant="primary" class="mt-2 mb-3" menu-class="w-100">
              <b-dropdown-item v-for="queryable in queryables" :key="queryable.id" @click="additionalFieldSelected(queryable)">
                {{ queryable.title }}
              </b-dropdown-item>
            </b-dropdown>

            <QueryableInput
              v-for="(filter, index) in query.filters" :key="filter.id"
              :title="filter.queryable.title"
              :value.sync="filter.value"
              :operator.sync="filter.operator"
              :schema="filter.queryable.schema"
              :index="index"
              @remove-queryable="removeQueryable(index)"
            />
          </b-form-group>
        </div>

        <b-form-group v-if="canSort" label="Sort" label-for="sort" description="Some APIs may not support all of the options.">
          <b-form-select id="sort" :value="sortTerm" :options="sortOptions" placeholder="Default" @input="sortFieldSet" />
          <SortButtons v-if="sortTerm" class="mt-1" :value="sortOrder" enforce @input="sortDirectionSet" />
        </b-form-group>

        <b-form-group label="Items per page" label-for="limit" :description="`Number of items requested per page, max. ${maxItems} items.`">
          <b-form-input
            id="limit" :value="query.limit" @change="setLimit" min="1"
            :max="maxItems" type="number"
            :placeholder="`Default (${itemsPerPage})`"
          />
        </b-form-group>
      </b-card-body>
      <b-card-footer>
        <b-button type="submit" variant="primary">Filter</b-button>
        <b-button type="reset" variant="danger" class="ml-3">Reset</b-button>
      </b-card-footer>
    </b-card>
  </b-form>
</template>

<script>
import { BDropdown, BDropdownItem, BForm, BFormGroup, BFormInput, BFormCheckbox, BFormSelect, BFormTags } from 'bootstrap-vue';

import { mapGetters, mapState } from "vuex";
import Loading from './Loading.vue';
import Utils from '../utils';

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
    BFormTags,
    DatePicker: () => import('vue2-datepicker'),
    QueryableInput: () => import('./QueryableInput.vue'),
    Loading,
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
    canFilterExtents: {
      type: Boolean,
      default: false
    },
    canSort: {
      type: Boolean,
      default: false
    },
    canFilterCql: {
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
      query: this.getDefaultValues(),
      loaded: false
    };
  },
  computed: {
    ...mapState(['itemsPerPage', 'queryables', 'apiCollections']),
    ...mapGetters(['hasMoreCollections', 'root']),
    collections() {
      if (this.hasMoreCollections || this.collectionOnly) {
        return [];
      }
      return this.apiCollections
        .map(c => ({
          value: c.id,
          text: c.title || c.id
        }))
        .sort((a,b) => a.text.localeCompare(b.text));
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        let query = Object.assign({}, this.getDefaultValues(), value);
        if (Array.isArray(query.datetime)) {
          query.datetime = query.datetime.map(Utils.dateFromUTC);
        }
        else if (query.filters.length > 0) {
          query.filters = query.filters.map(f => Object.assign({}, f));
        }
        this.query = query;
      }
    }
  },
  created() {
    let promises = [];
    if (this.canFilterCql) {
      promises.push(
        this.$store.dispatch('loadQueryables', {
          stac: this.stac,
          refParser: require('@apidevtools/json-schema-ref-parser')
        }).catch(error => console.error(error))
      );
    }
    if (!this.collectionOnly && this.apiCollections.length === 0) {
      promises.push(
        this.$store.dispatch('loadNextApiCollections', {stac: this.root, show: true})
          .catch(error => console.error(error))
      );
    }
    Promise.all(promises).finally(() => this.loaded = true);
  },
  methods: {
    sortFieldSet(value) {
      this.sortTerm = value;
    },
    sortDirectionSet(value) {
      this.sortOrder = value;
    },
    removeQueryable(queryableIndex) {
      this.query.filters.splice(queryableIndex, 1);
    },
    additionalFieldSelected(queryable) {
      this.query.filters.push({
        value: null,
        operator: null,
        queryable
      });
    },
    getDefaultValues() {
      return {
        datetime: null,
        bbox: null,
        limit: null,
        ids: [],
        collections: [],
        sortby: null,
        filters: []
      };
    },
    onSubmit() {
      if (this.sort) {
        this.query.sortby = this.formatSort();
      }
      this.$emit('input', this.query, false);
    },
    async onReset() {
      this.query = this.getDefaultValues();
      this.$emit('input', this.query, true);
    },
    setLimit(limit) {
      limit = Number.parseInt(limit, 10);
      if (limit > this.maxItems) {
        this.query.limit = this.maxItems;
      }
      else if (limit > 0) {
        this.query.limit = limit;
      }
      else {
        this.query.limit = null;
      }
    },
    setBBox(bounds) {
      if (this.provideBBox) {
        this.query.bbox = bounds;
      }
      else {
        this.query.bbox = null;
      }
    },
    setDateTime(datetime) {
      if (datetime.find(dt => dt instanceof Date)) {
        datetime = datetime.map(Utils.dateToUTC);
        this.query.datetime = datetime;
      }
      else {
        this.query.datetime = null;
      }
    },
    setCollections(collections) {
      this.query.collections = collections;
    },
    setIds(ids) {
      this.query.ids = ids;
    },
    formatSort() {
      if (this.sort && this.sortTerm) {
        let order = this.sortOrder < 0 ? '-' : '';
        return `${order}${this.sortTerm}`;
      }
      else {
        return null;
      }
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
  position: relative;

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
}
</style>