<template>
  <b-form class="filter mb-4" @submit.stop.prevent="onSubmit" @reset="onReset">
    <b-card no-body :title="title">
      <b-card-body>
        <Loading v-if="!loaded" fill />

        <b-card-title v-if="title" :title="title" />

        <b-form-group v-if="canFilterFreeText" class="filter-freetext" :label="$t('search.freeText')" :label-for="ids.q" :description="$t('search.freeTextDescription')">
          <multiselect
            :id="ids.q"
            v-model="query.q"
            :multiple="true"
            :taggable="true"
            :options="query.q"
            :placeholder="$t('search.enterSearchTerms')"
            :tag-placeholder="$t('search.addSearchTerm')"
            :no-options="$t('search.addSearchTerm')"
            @tag="addSearchTerm"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
          </multiselect>
        </b-form-group>

        <b-form-group v-if="canFilterExtents" class="filter-datetime" :label="$t('search.temporalExtent')" :label-for="ids.datetime" :description="$t('search.dateDescription')">
          <VueDatePicker
            input-class="form-control mx-input"
            :id="ids.datetime" 
            v-model="datetime"
            :locale="datepickerLang"
            :formats="{ input: dateTimeFormat }"
            :week-start="weekStartDay"
            :close-on-scroll="false"
            :placeholder="$t('search.selectDateRange')"
            :time-config="{ 
              enableTimePicker: true, 
              seconds: true,
              timePickerInline: true 
            }"
            :input-attrs="{ clearable: true }"
            auto-apply
            range
            :multi-calendars="2"
          />
        </b-form-group>

        <b-form-group v-if="canFilterExtents" class="filter-bbox" :label="$t('search.spatialExtent')" :label-for="ids.bbox">
          <b-form-checkbox :id="ids.bbox" v-model="provideBBox" value="1">{{ $t('search.filterBySpatialExtent') }}</b-form-checkbox>
          <MapSelect class="mb-4" v-if="provideBBox" v-model="query.bbox" :stac="stac" />
        </b-form-group>

        <b-form-group v-if="conformances.CollectionIdFilter" class="filter-collection" :label="$tc('stacCollection', collections.length)" :label-for="ids.collections">
          <multiselect
            v-model="selectedCollections"
            v-bind="collectionSelectOptions"
            @tag="addCollection"
            @search-change="searchCollections"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
            <template v-if="additionalCollectionCount > 0" #afterList>
              <li>
                <strong class="multiselect__option multiselect__option--disabled">
                  {{ $t("multiselect.andMore", {count: additionalCollectionCount}) }}
                </strong>
              </li>
            </template>
          </multiselect>
        </b-form-group>

        <b-form-group v-if="conformances.ItemIdFilter" class="filter-item-id" :label="$t('search.itemIds')" :label-for="ids.ids">
          <multiselect
            :id="ids.ids"
            v-model="query.ids"
            :multiple="true"
            :taggable="true"
            :options="query.ids"
            :placeholder="$t('search.enterItemIds')"
            :tag-placeholder="$t('search.addItemIds')"
            :no-options="$t('search.addItemIds')"
            @tag="addId"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
          </multiselect>
        </b-form-group>

        <b-form-group v-if="showAdditionalFilters" class="additional-filters" :label="$t('search.additionalFilters')">
          <b-form-radio-group v-model="filtersAndOr" :options="andOrOptions" name="logical" size="sm" />

          <b-dropdown size="sm" :text="$t('search.addFilter')" variant="primary" class="queryables mt-2 mb-3" menu-class="w-100" toggle-class="w-100">
            <template v-for="queryable in sortedQueryables" :key="queryable.id">
              <b-dropdown-item v-if="queryable.supported" @click="additionalFieldSelected(queryable)" link-class="d-flex justify-content-between align-items-center">
                <span>{{ queryable.title }}</span>
                <b-badge variant="dark" class="ms-2">{{ queryable.id }}</b-badge>
              </b-dropdown-item>
            </template>
          </b-dropdown>

          <QueryableInput
            v-for="(filter, index) in filters" :key="filter.id"
            v-model:value="filter.value"
            v-model:operator="filter.operator"
            :queryable="filter.queryable"
            :index="index"
            :cql="cql"
            @remove-queryable="removeQueryable(index)"
          />
        </b-form-group>

        <hr v-if="canFilterExtents || conformances.CollectionIdFilter || conformances.ItemIdFilter || showAdditionalFilters">

        <b-form-group v-if="canSort" class="sort" :label="$t('sort.title')" :label-for="ids.sort" :description="$t('search.notFullySupported')">
          <multiselect
            :id="ids.sort"
            v-model="sortTerm"
            :options="sortOptions"
            track-by="value"
            label="text"
            :placeholder="$t('default')"
            :select-label="$t('multiselect.selectLabel')"
            :selected-label="$t('multiselect.selectedLabel')"
            :deselect-label="$t('multiselect.deselectLabel')"
          >
            <template #option="{option}">
              <span class="d-flex justify-content-between align-items-center">
                <span>{{ option.text }}</span>
                <b-badge v-if="option.value" variant="dark" class="ms-2">{{ option.value }}</b-badge>
              </span>
            </template>
          </multiselect>
          <SortButtons v-if="sortTerm && sortTerm.value" class="mt-1" v-model="sortOrder" :enforce="true" />
        </b-form-group>

        <b-form-group class="limit" :label="$t('search.itemsPerPage')" :label-for="ids.limit" :description="$t('search.itemsPerPageDescription', {maxItems})">
          <b-form-input
            :id="ids.limit" :model-value="query.limit" @update:model-value="setLimit" min="1"
            :max="maxItems" type="number"
            :placeholder="limitPlaceholder"
          />
        </b-form-group>
      </b-card-body>
      <b-card-footer>
        <b-button type="submit" variant="primary">{{ $t('submit') }}</b-button>
        <b-button type="reset" variant="danger" class="ms-3">{{ $t('reset') }}</b-button>
      </b-card-footer>
    </b-card>
  </b-form>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapGetters, mapState } from "vuex";
import { BCard, BCardBody, BCardFooter, BCardTitle, BDropdown, BDropdownItem } from 'bootstrap-vue-next';

import refParser from '@apidevtools/json-schema-ref-parser';

import Utils, { schemaMediaType } from '../utils';
import { ogcQueryables } from "../rels";

import ApiCapabilitiesMixin, { TYPES } from './ApiCapabilitiesMixin';
import DatePickerMixin from './DatePickerMixin';
import Loading from './Loading.vue';

import { STAC } from 'stac-js'; 
import { createSTAC, Collection } from '../models/stac';
import Cql from '../models/cql2/cql';
import Queryable from '../models/cql2/queryable';
import CqlValue from '../models/cql2/value';
import CqlLogicalOperator from '../models/cql2/operators/logical';
import { stacRequest } from '../store/utils';

function getQueryDefaults() {
  return {
    q: [],
    datetime: null,
    bbox: null,
    limit: null,
    ids: [],
    collections: [],
    sortby: null,
    filters: null
  };
}

function getDefaults() {
  return {
    sortOrder: 1,
    sortTerm: null,
    provideBBox: false,
    // Store previous bbox so that it survives when the map is temporarily hidden
    bbox: null,
    query: getQueryDefaults(),
    filtersAndOr: 'and',
    filters: [],
    selectedCollections: []
  };
}

let formId = 0;

export default defineComponent({
  name: 'SearchFilter',
  components: {
    Loading,
    BCard,
    BCardBody,
    BCardFooter,
    BCardTitle,
    BDropdown,
    BDropdownItem,
    QueryableInput: defineAsyncComponent(() => import('./QueryableInput.vue')),
    MapSelect: defineAsyncComponent(() => import('./maps/MapSelect.vue')),
    SortButtons: defineAsyncComponent(() => import('./SortButtons.vue')),
    Multiselect: defineAsyncComponent(() => import('vue-multiselect')),
  },
  mixins: [
    ApiCapabilitiesMixin,
    DatePickerMixin
  ],
  props: {
    parent: {
      type: Object,
      default: null
    },
    title: {
      type: String,
      required: true
    },
    type: { // Collections or Global or Items
      type: String,
      required: true
    },
    value: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['input'],
  data() {
    return Object.assign({
      results: null,
      loaded: false,
      queryables: null,
      hasAllCollections: false,
      collections: [],
      collectionsLoadingTimer: null,
      additionalCollectionCount: 0
    }, getDefaults());
  },
  computed: {
    ...mapState(['searchResultsPerPage', 'maxEntriesPerPage', 'uiLanguage']),
    ...mapGetters(['canSearchCollections', 'supportsConformance']),
    collectionSelectOptions() {
      let taggable = !this.hasAllCollections;
      let isResult = this.collections.length > 0 && !this.hasAllCollections;
      return {
        id: this.ids.collections,
        multiple: true,
        taggable,
        options: this.collections, // query.collections
        trackBy: "value",
        label: "text",
        placeholder: taggable ? this.$t('search.enterCollections') : this.$t('search.selectCollections'),
        tagPlaceholder: this.$t('search.addCollections'),
        selectLabel: this.$t('multiselect.selectLabel'),
        selectedLabel: this.$t('multiselect.selectedLabel'),
        deselectLabel: this.$t('multiselect.deselectLabel'),
        limitText: count => this.$t("multiselect.andMore", {count}),
        loading: this.collectionsLoadingTimer !== null,
        showNoResults: false,
        internalSearch: !isResult
      };
    },
    collectionSearchLink() {
      return this.parent && this.parent.isCatalogLike() && this.parent.getApiCollectionsLink();
    },
    canSearchCollectionsFreeText() {
      return this.canSearchCollections && this.supportsConformance(TYPES.Collections.FreeText);
    },
    ids() {
      let obj = {};
      ['q', 'datetime', 'bbox', 'collections', 'ids', 'sort', 'limit']
        .forEach(field => obj[field] = field + formId);
      return obj;
    },
    stac() {
      if (this.parent instanceof STAC) {
        return this.parent;
      }
      return null;
    },
    andOrOptions() {
      return [
        { value: 'and', text: this.$t('search.logical.and') },
        { value: 'or', text: this.$t('search.logical.or') },
      ];
    },
    showAdditionalFilters() {
      return this.cql && Array.isArray(this.queryables) && this.queryables.length > 0;
    },
    sortOptions() {
      // todo: this should use queryables when available
      // nevertheless, let's try to provide some reasonable defaults
      const criteria = [
        { text: this.$t('default'), value: null },
        { text: this.$t('fields.Identifier'), value: 'id' },
      ];
      const prefix = this.type === 'Collections' ? '' : 'properties.';
      criteria.push({ text: this.$t('fields.Title'), value: `${prefix}title` });
      if (this.type !== 'Collections') {
        criteria.push({ text: this.$t('fields.Time of Data'), value: 'properties.datetime' });
      }
      criteria.push({ text: this.$t('fields.Created'), value: `${prefix}created` });
      criteria.push({ text: this.$t('fields.Updated'), value: `${prefix}updated` });
      return criteria;
    },
    sortedQueryables() {
      if (!Array.isArray(this.queryables)) {
        return [];
      }
      const collator = new Intl.Collator(this.uiLanguage);
      return this.queryables.slice(0).sort((a, b) => collator.compare(a.title, b.title));
    },
    maxItems() {
      return this.maxEntriesPerPage || 1000;
    },
    limitPlaceholder() {
      if (this.searchResultsPerPage > 0) {
        return this.$t('defaultWithValue', {value: this.searchResultsPerPage});
      }
      return this.$t('default');
    },
    datetime: {
      get() {
        return Array.isArray(this.query.datetime) ? this.query.datetime.map(d => Utils.dateFromUTC(d)) : null;
      },
      set(val) {
        this.query.datetime = Array.isArray(val) ? val.map(d => Utils.dateToUTC(d)) : null;
      }
    }
  },
  watch: {
    parent: {
      immediate: true,
      handler(newStac, oldStac) {
        if (newStac instanceof Collection) {
          newStac.setApiDataListener('searchfilter' + formId, () => this.updateApiCollections());
        }
        if (oldStac instanceof Collection) {
          oldStac.setApiDataListener('searchfilter' + formId);
        }
        this.updateApiCollections();
      }
    },
    value: {
      immediate: true,
      deep: true,
      handler(value) {
        this.query = Object.assign(getQueryDefaults(), value);
        if (this.collections.length > 0 && this.hasAllCollections) {
          this.selectedCollections = this.collections.filter(c => this.query.collections.includes(c.value));
        }
        else {
          this.selectedCollections = this.query.collections.map(id => {
            let collection = this.selectedCollections.find(c => c.value === id);
            return collection ? collection : this.collectionToMultiSelect({id});
          });
        }
      }
    },
    query: {
      deep: true,
      handler(query) {
        if (query?.bbox) {
          // Store the previously selected bbox so that it can be restored after the
          // map had been hidden accidentally.
          this.bbox = query.bbox;
        }
      }
    },
    selectedCollections: {
      deep: 1,
      handler(collections) {
        this.query.collections = collections.map(c => c.value);
      }
    },
    provideBBox(shown) {
      if (!shown) {
        this.query.bbox = null;
      }
      else {
        this.query.bbox = this.bbox;
      }
    }
  },
  beforeCreate() {
    formId++;
  },
  created() {
    let promises = [];
    if (this.cql && this.stac && this.type !== 'Collections') {
      let queryableLink = this.findQueryableLink(this.stac.links);
      promises.push(
        this.loadQueryables(queryableLink)
          .catch(error => console.error(error))
      );
    }
    if ((this.type === 'Collections' || this.conformances.CollectionIdFilter) && this.stac) {
      promises.push(
        this.loadCollections(this.stac.getApiCollectionsLink())
          .then(({collections, queryableLink}) => {
            this.collections = collections;
            if (this.collections.length > 0) {
              this.hasAllCollections = true;
            }
            return this.loadQueryables(queryableLink);
          })
          .catch(error => console.error(error))
      );
    }
    Promise.all(promises).finally(() => this.loaded = true);
  },
  methods: {
    resetSearchCollection() {
      clearTimeout(this.collectionsLoadingTimer);
      this.collectionsLoadingTimer = null;
    },
    searchCollections(text) {
      if (!this.canSearchCollectionsFreeText || this.hasAllCollections) {
        return;
      }
      this.resetSearchCollection();
      this.additionalCollectionCount = 0;
      if (typeof text !== 'string' || text.trim().length < 2) {
        this.collections = [];
        return;
      }
      this.collectionsLoadingTimer = setTimeout(async () => {
        try {
          const link = Utils.addFiltersToLink(this.collectionSearchLink, {q: [text]});
          const response = await stacRequest(this.$store, link);
          
          // Only set collections if response is valid AND collectionsLoadingTimer has not been reset.
          // If collectionsLoadingTimer has been reset, the result is not relevant anylonger.
          if (this.collectionsLoadingTimer && Utils.isObject(response.data) && Array.isArray(response.data.collections)) {
            this.collections = this.prepareCollections(response.data.collections);
            if (typeof response.data.numberMatched === 'number') {
              this.additionalCollectionCount = response.data.numberMatched - this.collections.length;
            }
          }
        } catch (error) {
          console.error(error);
          this.collections = [];
        } finally {
          this.resetSearchCollection();
        }
      }, 250);
    },
    async loadCollections(link) {
      let hasMore = false;
      let data = {
        collections: [],
        queryableLink: null
      };

      if (this.type === 'Global' && this.collections) {
        data.collections = this.collections;
        hasMore = false;
      }
      else if (this.type === 'Global' || this.type === 'Collections') {
        let response = await stacRequest(this.$store, link);
        
        if (!Utils.isObject(response.data)) {
          return {};
        }

        if (Array.isArray(response.data.links)) {
          let links = response.data.links;
          hasMore = Boolean(Utils.getLinkWithRel(links, 'next'));
          data.queryableLink = this.findQueryableLink(links) || null;
        }

        // todo: use ItemCollection / CollectionCollection
        if (!hasMore && Array.isArray(response.data.collections)) {
          let collections = response.data.collections
            .map(collection => createSTAC(collection));
          data.collections = this.prepareCollections(collections);
        }
      }
      return data;
    },
    updateApiCollections() {
      if (!this.parent) {
        return;
      }
      let apiCollections = this.parent.getChildren('collections');
      let nextCollectionsLink = this.parent._apiChildren.next;
      if (!Array.isArray(apiCollections) || nextCollectionsLink || !this.conformances.CollectionIdFilter) {
        this.collections = [];
        return;
      }
      this.collections = this.prepareCollections(apiCollections);
      if (this.collections.length > 0) {
        this.hasAllCollections = true;
      }
    },
    collectionToMultiSelect(c) {
      return {
        value: c.id,
        text: c.title || c.id
      };
    },
    prepareCollections(collections) {
      const collator = new Intl.Collator(this.uiLanguage);
      return collections
        .map(this.collectionToMultiSelect)
        .sort((a,b) => collator.compare(a.text, b.text));
    },
    findQueryableLink(links) {
      return Utils.getLinksWithRels(links, ogcQueryables)
          .find(link => Utils.isMediaType(link.type, schemaMediaType, true));
    },
    async loadQueryables(link) {
      this.queryables = [];

      if (!Utils.isObject(link)) {
        return;
      }

      let response = await stacRequest(this.$store, link);
      if (!Utils.isObject(response.data)) {
        return;
      }

      let schemas;
      try {
        schemas = await refParser.dereference(response.data);
      } catch (error) {
        // Use data with $refs included as fallback anyway
        console.error(error);
        schemas = response.data;
      }

      if (Utils.isObject(schemas) && Utils.isObject(schemas.properties)) {
        this.queryables = Object.entries(schemas.properties)
          .map(([key, schema]) => new Queryable(key, schema));
      }
    },
    buildFilter() {
      if (this.filters.length === 0) {
        return null;
      }
      const args = this.filters.map(f => new f.operator(f.queryable, f.value));
      const logical = CqlLogicalOperator.create(this.filtersAndOr, args);
      return new Cql(logical);
    },
    removeQueryable(queryableIndex) {
      this.filters.splice(queryableIndex, 1);
    },
    additionalFieldSelected(queryable) {
      const operators = queryable.getOperators(this.cql);
      this.filters.push({
        id: `${queryable.id}-${Date.now()}-${Math.random()}`, // Unique ID
        value: CqlValue.create(queryable.defaultValue),
        operator: operators[0],
        queryable
      });
    },
    onSubmit() {
      if (this.canSort && this.sortTerm && this.sortOrder) {
        this.query.sortby = this.formatSort();
      }
      let filters = this.buildFilter();
      this.query.filters = filters;
      this.$emit('input', this.query, false);
    },
    async onReset() {
      Object.assign(this, getDefaults());
      this.$emit('input', {}, true);
    },
    setLimit(limit) {
      limit = Number.parseInt(limit, 10);
      if (limit > this.maxItems) {
        limit = this.maxItems;
      }
      else if (typeof limit !== 'number' || isNaN(limit) || limit < 1) {
        limit = null;
      }
      this.query.limit = limit;
    },
    addSearchTerm(term) {
      if (!Utils.hasText(term)) {
        return;
      }
      this.query.q.push(term);
    },
    addCollection(collection) {
      if (!this.collectionSelectOptions.taggable) {
        return;
      }
      this.resetSearchCollection();
      let opt = this.collectionToMultiSelect({id: collection});
      this.selectedCollections.push(opt);
      this.collections.push(opt);
      this.query.collections.push(collection);
    },
    addId(id) {
      this.query.ids.push(id);
    },
    formatSort() {
      if (this.sortTerm && this.sortTerm.value && this.sortOrder) {
        let order = this.sortOrder < 0 ? '-' : '';
        return `${order}${this.sortTerm.value}`;
      }
      else {
        return null;
      }
    }
  }
});
</script>

<style lang="scss">
@import '../theme/datepicker.scss';

.queryables .dropdown-menu {
  max-height: 90vh;
  overflow: auto;
}

// General item filter style
.filter {
  position: relative;
  min-width: 400px;

  .b-form-group {
    padding-left: 1em;
    margin-bottom: 1em;

    > label,
    > legend {
      margin-left: -1em;
      font-weight: 600;
    }

    > small {
      display: block;
    }
  }
}
</style>
