<template>
  <b-form class="filter mb-4" @submit.stop.prevent="onSubmit" @reset="onReset">
    <b-card no-body :title="title">
      <b-card-body>
        <template v-if="droppedFilterNames.length > 0">
          <b-alert
            variant="warning"
            dismissible
            show
            class="mb-3"
            @close="$store.commit('search/clearDroppedFilters', type)"
          >
            {{ $t('search.droppedFilters', { filters: formattedDroppedFilters }) }}
          </b-alert>
        </template>
        <Loading v-if="!loaded" fill />
        <b-card-title v-if="title" :title="title" />

        <b-form-group v-if="canFilterFreeText" class="filter-freetext" :label="$t('search.freeText')" :label-for="ids.q" :description="$t('search.freeTextDescription')">
          <multiselect
            :id="ids.q"
            v-model="searchQ"
            multiple taggable
            :options="searchQ"
            :placeholder="$t('search.enterSearchTerms')"
            :tag-placeholder="$t('search.addSearchTerm')"
            :no-options="$t('search.addSearchTerm')"
            @tag="addSearchTerm"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
          </multiselect>
        </b-form-group>

        <b-form-group v-if="canFilterExtents" class="filter-datetime" :label="$t('search.temporalExtent')" :label-for="ids.datetime" :description="isSingleDateExtent ? $t('search.disabledDueToSingleDate') : $t('search.dateDescription')">
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
            :min-date="temporalExtent?.[0]"
            :max-date="temporalExtent?.[1]"
            :start-date="temporalExtent?.[1]"
            :prevent-min-max-navigation="Boolean(temporalExtent)"
            auto-apply
            range
            :multi-calendars="2"
            :disabled="isSingleDateExtent"
          />
        </b-form-group>

        <b-form-group v-if="canFilterExtents" class="filter-bbox" :label="$t('search.spatialExtent')" :label-for="ids.bbox">
          <b-form-checkbox :id="ids.bbox" v-model="provideBBox">{{ $t('search.filterBySpatialExtent') }}</b-form-checkbox>
          <MapSelect class="mb-4" v-if="provideBBox" v-model="searchBBox" :stac="stac" />
        </b-form-group>

        <b-form-group v-if="conformances.CollectionIdFilter" class="filter-collection" :label="$t('stacCollection', collections.length)" :label-for="ids.collections">
          <multiselect
            :id="ids.collections"
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
            v-model="searchIds"
            multiple taggable
            :options="searchIds"
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
          <b-form-checkbox v-model="filtersNegate" size="sm">{{ $t('search.logical.not') }}</b-form-checkbox>

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
            v-model:negate="filter.negate"
            :queryable="filter.queryable"
            :index="index"
            :cql="cql"
            @remove-queryable="removeQueryable(index)"
          />
        </b-form-group>

        <hr v-if="canFilterExtents || conformances.CollectionIdFilter || conformances.ItemIdFilter || showAdditionalFilters">

        <b-form-group v-if="canSort" class="sort" :label="$t('sort.title')" :label-for="ids.sortby" :description="$t('search.notFullySupported')">
          <multiselect
            :id="ids.sortby"
            v-model="sortTerm"
            :options="sortOptions"
            track-by="value"
            label="text"
            :placeholder="$t('default')"
            :allow-empty="false"
            :show-labels="false"
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
            :id="ids.limit" v-model="searchLimit" min="1"
            :max="maxItems" type="number"
            :placeholder="limitPlaceholder"
          />
        </b-form-group>
      </b-card-body>
      <b-card-footer class="d-flex gap-3">
        <b-button type="submit" variant="primary">{{ $t('submit') }}</b-button>
        <b-button type="reset" variant="danger">{{ $t('reset') }}</b-button>
        <b-button v-if="canShowExampleCode" type="button" variant="secondary" @click="showCodeModal = true">{{ $t('exampleCode.title') }}</b-button>
      </b-card-footer>
    </b-card>
    <b-modal v-if="canShowExampleCode" v-model="showCodeModal" :title="$t('exampleCode.title')" size="xl">
      <SearchCode
        v-if="showCodeModal"
        :searchLinks="codeExampleSearchLinks"
        :filters="codeExampleQuery"
      />
      <template #footer="{ close }">
        <b-button variant="secondary" @click="close()">{{ $t('close') }}</b-button>
      </template>
    </b-modal>
  </b-form>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapGetters, mapState } from "vuex";
import { BCard, BCardBody, BCardFooter, BCardTitle, BDropdown, BDropdownItem, BModal } from 'bootstrap-vue-next';

import Utils from '../utils';
import { hasText, isObject } from 'stac-js/src/utils.js';

import ApiCapabilitiesMixin, { TYPES } from './ApiCapabilitiesMixin';
import DatePickerMixin from './DatePickerMixin';
import Loading from './Loading.vue';

import { CollectionCollection, STAC } from 'stac-js'; 
import { createSTAC } from '../models/stac';
import Cql from '../models/cql2/cql';
import CqlLogicalOperator, { CqlNot } from '../models/cql2/operators/logical';
import { fetchQueryablesForLink, fetchSchemaProperties } from '../store/utils';
import { FILTER_FIELDS } from '../store/modules/search';
import { formatKey } from '@radiantearth/stac-fields/helper';

function getDefaults() {
  return {
    sortOrder: 1,
    sortTerm: null,
    provideBBox: false,
    // Store previous bbox so that it survives when the map is temporarily hidden
    bbox: null,
    filtersAndOr: 'and',
    filtersNegate: false,
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
    BModal,
    SearchCode: defineAsyncComponent(() => import('./SearchCode.vue')),
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
      required: true,
      validator: value => ['Collections', 'Global', 'Items'].includes(value)
    },
    searchLink: {
      type: Object,
      default: null
    }
  },
  emits: ['input'],
  data() {
    return Object.assign({
      results: null,
      loaded: false,
      queryables: null,
      sortables: null,
      hasAllCollections: false,
      collections: [],
      collectionsLoadingTimer: null,
      additionalCollectionCount: 0,
      showCodeModal: false
    }, getDefaults());
  },
  computed: {
    ...mapState(['defaultCollectionSort', 'defaultItemSort', 'searchResultsPerPage', 'maxEntriesPerPage', 'uiLanguage']),
    ...mapState('search', ['droppedFilters']), 
    ...mapGetters(['canSearchCollections', 'getApiChildren', 'supportsConformance']),
    ...mapGetters('search', ['collectionSearchParams', 'itemSearchParams']),
    droppedFilterNames() {
      const labels = {
        freeText: () => this.$t('search.freeText'),
        sort: () => this.$t('sort.title'),
        datetime: () => this.$t('search.temporalExtent'),
        bbox: () => this.$t('search.spatialExtent'),
        cql2: (f) => f.queryable?.title || f.queryable?.id || f.id,
      };
      const scopedDroppedFilters = this.droppedFilters[this.type] || [];
      return scopedDroppedFilters
        .map(f => labels[f.type]?.(f))
        .filter(Boolean);
    },
    formattedDroppedFilters() {
      const formatter = new Intl.ListFormat(this.uiLanguage || 'en', { style: 'long', type: 'conjunction' });
      return formatter.format(this.droppedFilterNames);
    },
    collectionSelectOptions() {
      let taggable = !this.hasAllCollections;
      let isResult = this.collections.length > 0 && !this.hasAllCollections;
      return {
        id: this.ids.collections,
        multiple: true,
        taggable,
        options: this.collections,
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
      return this.parent?.isCatalogLike && this.parent.getApiCollectionsLink();
    },
    codeExampleSearchLinks() {
      const toMethodMap = (link) => {
        if (!link) {
          return {};
        }
        return { [(link.method || 'GET').toUpperCase()]: link };
      };
      if (this.type === 'Collections') {
        return toMethodMap(this.collectionSearchLink);
      }
      // For search endpoints, check if both GET and POST are available
      if (this.searchLink?.rel === 'search' && this.parent?.getSearchLink) {
        const get = this.parent.getSearchLink('GET');
        const post = this.parent.getSearchLink('POST');
        if (get || post) {
          const links = {};
          if (get) {
            links.GET = get;
          }
          if (post) {
            links.POST = post;
          }
          return links;
        }
      }
      return toMethodMap(this.searchLink);
    },
    canShowExampleCode() {
      return Object.keys(this.codeExampleSearchLinks).length > 0;
    },
    codeExampleQuery() {
      return {
        ...this.activeParams,
        sortby: this.formatSort(),
        filters: this.buildFilter()
      };
    },
    activeParams() {
      const params = this.type === 'Collections' 
        ? this.collectionSearchParams 
        : this.itemSearchParams;
      return params || {};
    },
    activeFilterSet() {
      return this.type === 'Collections'
        ? this.$store.state.search.collectionFilters
        : this.$store.state.search.itemFilters;
    },
    activeFilterLogic() {
      return this.activeFilterSet?.filterLogic || null;
    },
    canSearchCollectionsFreeText() {
      return this.canSearchCollections && this.supportsConformance(TYPES.Collections.FreeText);
    },
    ids() {
      let obj = {};
      FILTER_FIELDS.forEach(field => obj[field] = field + formId);
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
      // Use sortables from API if available
      if (Array.isArray(this.sortables) && this.sortables.length > 0) {
        return [
          { text: this.$t('default'), value: null },
          ...this.sortables
        ];
      }
      // Fallback: provide reasonable defaults when sortables are not available
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
        const dt = this.activeParams.datetime;
        return Array.isArray(dt) ? dt.map(d => Utils.dateFromUTC(d)) : null;
      },
      set(val) {
        const dt = Array.isArray(val) ? val.map(d => Utils.dateToUTC(d)) : null;
        this.commitToVuex('datetime', dt);
      }
    },
    temporalExtent() {
      if (this.stac && typeof this.stac.getTemporalExtent === 'function') {
        const extent = this.stac.getTemporalExtent();
        if (Array.isArray(extent)) {
          const [min, max] = extent;
          if (min instanceof Date || max instanceof Date) {
            return [min instanceof Date ? min : undefined, max instanceof Date ? max : undefined];
          }
        }
      }
      return null;
    },
    isSingleDateExtent() {
      const [min, max] = this.temporalExtent || [];
      return min instanceof Date && max instanceof Date && min.getTime() === max.getTime();
    },
    searchQ: {
      get() {
        const q = this.activeParams?.q;
        return Array.isArray(q) ? [...q] : [];
      },
      set(value) {
        this.commitToVuex('q', value);
      }
    },
    searchLimit: {
      get() {
        return this.activeParams.limit;
      },
      set(limit) {
        // moved old setlimit logic here
        limit = Number.parseInt(limit, 10);
        if (limit > this.maxItems) {
          limit = this.maxItems;
        } else if (typeof limit !== 'number' || isNaN(limit) || limit < 1) {
          limit = null;
        }
        this.commitToVuex('limit', limit);
      }
    },
    searchBBox: {
      get() {
        return Array.isArray(this.activeParams?.bbox) ? [...this.activeParams.bbox] : null;
      },
      set(val) {
        this.commitToVuex('bbox', val);
      }
    },
    searchIds: {
      get() { 
        const ids = this.activeParams?.ids;
        return Array.isArray(ids) ? [...ids] : [];
      },
      set(value) {
        this.commitToVuex('ids', value);
      }
    },
    apiCollectionsState() {
      return this.getApiChildren(this.parent);
    },
    apiCollectionsFromStore() {
      const list = this.apiCollectionsState?.list;
      if (!Array.isArray(list)) {
        return [];
      }
      return list.filter(collection => collection instanceof STAC && collection.isCollection);
    },
    apiCollectionsPaginated() {
      return Boolean(this.apiCollectionsState?.next || this.apiCollectionsState?.prev);
    }
  },
  watch: {
    parent: {
      immediate: true,
      handler() {
        this.updateApiCollections();
      }
    },
    apiCollectionsFromStore() {
      this.updateApiCollections();
    },
    apiCollectionsPaginated() {
      this.updateApiCollections();
    },
    '$route.query'(newQuery, oldQuery) {
      const getSearchState = (q) => {
        return Object.keys(q || {})
          .filter(k => k === 'searchtype' || k.startsWith('s.c.') || k.startsWith('s.i.'))
          .reduce((obj, k) => {
            obj[k] = q[k];
            return obj;
          }, {});
      };

      const newSearch = getSearchState(newQuery);
      const oldSearch = getSearchState(oldQuery);

      if (JSON.stringify(newSearch) !== JSON.stringify(oldSearch)) {
        this.rebuildFromUrl();
      }
    },
    'activeParams.collections': {
      deep: true,
      handler(vuexCollections) {
        this.syncVuexToUrl();
        
        const activeCollections = vuexCollections || [];
        
        const currentSelectedIds = (this.selectedCollections || []).map(c => c.value);
        
        if (activeCollections.length === currentSelectedIds.length && activeCollections.every((val, index) => val === currentSelectedIds[index])){
          return;
        }

        if (this.collections.length > 0 && this.hasAllCollections) {
          this.selectedCollections = this.collections.filter(c => activeCollections.includes(c.value));
        }
        else {
          this.selectedCollections = activeCollections.map(id => {
            let collection = this.selectedCollections.find(c => c.value === id);
            return collection ? collection : this.collectionToMultiSelect({id});
          });
        }
      }
    },
    'activeParams.bbox': {
      immediate: true,
      handler(newBbox) {
        if (newBbox && newBbox.length > 0) {
          this.provideBBox = true;
          this.bbox = newBbox; 
        }
        else if (!this.loaded) {
          this.provideBBox = false;
        }
      } 
    },
    activeFilterLogic: {
      immediate: true,
      deep: true,
      handler(logic) {
        if (!logic) {
          return;
        }
        this.filtersAndOr = logic.andOr ?? 'and';
        this.filtersNegate = logic.negate ?? false;
      }
    },
    'activeFilterSet.rawFilters': {
      immediate: true,
      handler(rows) {
        rows = Array.isArray(rows) ? rows : [];
        const currentIds = this.filters.map(f => f.id);
        if (rows.length === currentIds.length && rows.every((row, i) => row.id === currentIds[i])) {
          return;
        }
        // Shallow-copy the rows so that form edits don't mutate the store state
        this.filters = rows.map(row => ({ ...row }));
      }
    },
    'activeParams.sortby'() {
      this.syncSortFromStore();
    },
    selectedCollections: {
      deep: 1,
      handler(collections) {
        this.commitToVuex('collections', collections.map(c => c.value));
      }
    },
    provideBBox(shown) {
      if (!this.loaded) {
        return;
      }

      if (shown !== true) {
        this.commitToVuex('bbox', null);
      }
      else if (this.bbox && this.bbox.length > 0) {
        this.commitToVuex('bbox', this.bbox);
      }
    },
    sortTerm() {
      this.commitToVuex('sortby', this.formatSort());
    },
    sortOrder() {
      this.commitToVuex('sortby', this.formatSort());
    }
  },
  beforeCreate() {
    formId++;
  },
  created() {
    const hasUrlFilters = this.rebuildFromUrl();
    if (hasUrlFilters) {
      this.$nextTick(() => {
        this.$emit('input', this.activeParams);
      });
    }
    this.syncVuexToUrl();

    let promises = [];
    if (this.stac && this.type !== 'Collections') {
      if (this.cql) {
        const queryableLink = this.stac.getQueryablesLink();
        promises.push(
          this.loadQueryables(queryableLink)
            .catch(error => console.error(error))
        );
      }
      if (this.canSort) {
        const sortableLink = this.stac.getSortablesLink();
        promises.push(
          this.loadSortables(sortableLink)
            .catch(error => console.error(error))
        );
      }
    }
    if ((this.type === 'Collections' || this.conformances.CollectionIdFilter) && this.stac) {
      promises.push(
        this.loadCollections(this.stac.getApiCollectionsLink())
          .then(({collections, queryableLink, sortableLink}) => {
            this.collections = collections;
            if (this.collections.length > 0) {
              this.hasAllCollections = true;
            }
            let subPromises = [];
            subPromises.push(this.loadQueryables(queryableLink));
            if (this.canSort) {
              subPromises.push(this.loadSortables(sortableLink));
            }
            return Promise.all(subPromises);
          })
          .catch(error => console.error(error))
      );
    }
    Promise.all(promises).finally(() => {
      // Show the sort order from the store (e.g. carried over from another
      // search) if there is one, otherwise apply the configured default
      if (!this.syncSortFromStore()) {
        this.resetSort();
      }
      this.loaded = true;
    });
  },
  methods: {
    syncVuexToUrl() {
      const params = this.activeParams || {};
      const fieldsToSync = ['q', 'datetime', 'bbox', 'limit', 'collections', 'ids', 'sortby'];
      
      const prefix = this.type === 'Collections' ? 's.c.' : 's.i.';

      fieldsToSync.forEach(field => {
        const value = params[field];
        let urlValue = value;

        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          urlValue = undefined;
        } else if (Array.isArray(value)) {
          if (field === 'datetime') {
            urlValue = value.map(d => d instanceof Date ? d.toISOString() : d).join('/');
          } else if (['q', 'collections', 'ids'].includes(field)) {
            urlValue = value.map(encodeURIComponent).join(',');
          } else {
            urlValue = value.join(',');
          }
        }

        this.$store.commit('updateState', { 
          type: `${prefix}${field}`, 
          value: urlValue 
        });
      });
    },

    rebuildFromUrl() {
      const query = this.$route.query || {};
      let foundFiltersInUrl = false;
      
      const prefix = this.type === 'Collections' ? 's.c.' : 's.i.';
      
      for (const [key, value] of Object.entries(query)) {
        if (key.startsWith(prefix) && value !== null && value !== undefined) {
          const field = key.replace(prefix, '');
          let parsedValue = value;
          
          if (typeof value === 'string') {
            if (['q', 'collections', 'ids'].includes(field)) {
              parsedValue = value.split(/,(?!\s)/).map(decodeURIComponent);
            } else {
              const decodedValue = decodeURIComponent(value);
              
              if (field === 'bbox') {
                const coords = decodedValue.split(',').map(Number);
                if ((coords.length === 4 || coords.length === 6) && coords.every(n => !Number.isNaN(n))) {
                  parsedValue = coords;
                } else {
                  continue;
                }
              } else if (field === 'datetime') {
                const parts = decodedValue.includes('/') ? decodedValue.split('/') : decodedValue.split(',');
                parsedValue = parts.map(d => {
                  if (!d || d === '..') {return d;}
                  const date = new Date(d);
                  return isNaN(date.getTime()) ? d : date;
                });
              } else if (field === 'limit') {
                const limitInt = Number.parseInt(decodedValue, 10);
                if (!Number.isNaN(limitInt) && limitInt > 0) {
                  parsedValue = Math.min(limitInt, this.maxItems || 10000); 
                } else {
                  continue;
                }
              }
            }
          }
          
          const mutation = this.type === 'Collections' ? 'search/setCollectionFilters' : 'search/setItemFilters';
          this.$store.commit(mutation, { [field]: parsedValue });
          foundFiltersInUrl = true;
        }
      }
      
      return foundFiltersInUrl;
    },
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
          const response = await this.$store.dispatch('request', { link });
          
          // Only set collections if response is valid AND collectionsLoadingTimer has not been reset.
          // If collectionsLoadingTimer has been reset, the result is not relevant anylonger.
          if (this.collectionsLoadingTimer && CollectionCollection.isResponse(response.data)) {
            const stac = createSTAC(response.data, null, this.$store);
            this.collections = this.prepareCollections(stac.getAll());
            if (typeof stac.numberMatched === 'number') {
              this.additionalCollectionCount = stac.numberMatched - this.collections.length;
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
      const data = {
        collections: [],
        queryableLink: null,
        sortableLink: null
      };

      if (this.type === 'Global' && this.collections) {
        data.collections = this.collections;
      }
      else if (this.type === 'Global' || this.type === 'Collections') {
        let response = await this.$store.dispatch('request', { link });
        
        if (!isObject(response.data)) {
          return {};
        }

        const stac = createSTAC(response.data, null, this.$store);
        if (typeof stac.getQueryablesLink === 'function') {
          data.queryableLink = stac.getQueryablesLink();
        }
        if (typeof stac.getSortablesLink === 'function') {
          data.sortableLink = stac.getSortablesLink();
        }

        const paginationLinks = stac.getPaginationLinks();
        if (!paginationLinks.next && stac instanceof CollectionCollection) {
          data.collections = this.prepareCollections(stac.getAll());
        }
      }
      return data;
    },
    updateApiCollections() {
      if (!this.parent) {
        return;
      }
      let apiCollections = this.apiCollectionsFromStore;
      if (!Array.isArray(apiCollections) || this.apiCollectionsPaginated || !this.conformances.CollectionIdFilter) {
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
    async loadQueryables(link) {
      this.queryables = await fetchQueryablesForLink(this.$store, link);
    },
    async loadSortables(link) {
      if (!isObject(link)) {
        return;
      }
      this.sortables = [];
      const sortables = await fetchSchemaProperties(this.$store, link);
      const collator = new Intl.Collator(this.uiLanguage);
      this.sortables = sortables
        .map(([key, schema]) => ({
          value: key,
          text: schema.title || formatKey(key)
        }))
        .sort((a, b) => collator.compare(a.text, b.text));
    },
    buildFilter() {
      if (this.filters.length === 0) {
        return null;
      }
      const args = this.filters.map(f => {
        let filter = new f.operator(f.queryable, f.value);
        if (f.negate) {
          filter = new CqlNot(filter);
        }
        return filter;
      });
      let logical = CqlLogicalOperator.create(this.filtersAndOr, args);
      if (this.filtersNegate) {
        logical = new CqlNot(logical);
      }
      return new Cql(logical, this.cql);
    },
    removeQueryable(queryableIndex) {
      this.filters.splice(queryableIndex, 1);
    },
    additionalFieldSelected(queryable) {
      const operators = queryable.getOperators(this.cql);
      if (operators.length === 0) {
        this.$store.commit('showGlobalError', {
          message: this.$t('search.noOperatorsError', {queryable: queryable.id})
        });
        return;
      }
      const operator = operators[0];
      this.filters.push({
        id: `${queryable.id}-${Date.now()}-${Math.random()}`, // Unique ID
        value: operator.getDefaultValue(queryable),
        operator,
        queryable,
        negate: false
      });
    },
    onSubmit() {
      this.commitToVuex('sortby', this.formatSort());
      this.commitToVuex('filters', this.buildFilter());
      // Copy the rows so that later form edits don't mutate the store state
      this.commitToVuex('rawFilters', this.filters.map(f => ({ ...f })));
      this.commitToVuex('filterLogic', {
        andOr: this.filtersAndOr,
        negate: this.filtersNegate,
      });
      // Executing a search retires the notice about the previous carry-over
      this.$store.commit('search/clearDroppedFilters', this.type);

      this.$emit('input', this.activeParams);
    },
    onReset() {
      Object.assign(this, getDefaults());
      this.resetSort();
      if (this.type === 'Collections') {
        this.$store.commit('search/resetCollectionFilters');
      } else {
        this.$store.commit('search/resetItemFilters');
      }
      // The notice about the carry-over refers to a state that was just discarded
      this.$store.commit('search/clearDroppedFilters', this.type);

      this.syncVuexToUrl();

      this.$emit('input', this.activeParams, true);
    },
    addSearchTerm(term) {
      if (!hasText(term)) {
        return;
      }
      const currentQ = [...this.searchQ];
      currentQ.push(term);
      this.searchQ = currentQ;
    },
    addCollection(collection) {
      if (!this.collectionSelectOptions.taggable) {
        return;
      }
      this.resetSearchCollection();
      let opt = this.collectionToMultiSelect({id: collection});
      this.selectedCollections.push(opt);
      this.collections.push(opt);
    },
    addId(id) {
      const currentIds = [...this.searchIds];
      currentIds.push(id);
      this.searchIds = currentIds;
    },
    formatSort() {
      if (this.canSort && this.sortTerm && this.sortTerm.value && this.sortOrder) {
        let order = this.sortOrder < 0 ? '-' : '';
        return `${order}${this.sortTerm.value}`;
      }
      else {
        return null;
      }
    },
    commitToVuex(field, value) {
      const mutation = this.type === 'Collections' ? 'search/setCollectionFilters' : 'search/setItemFilters';
      this.$store.commit(mutation, { [field]: value });
      this.$nextTick(() => {
        this.syncVuexToUrl();
      });
    },
    // Selects the sort field and direction stored for this search (e.g.
    // carried over from another search) in the form.
    // Returns whether the stored sort is shown in the form.
    syncSortFromStore() {
      if (!this.canSort) {
        return false;
      }
      const sortby = this.activeParams?.sortby;
      if (!hasText(sortby)) {
        return false;
      }
      if (sortby === this.formatSort()) {
        return true;
      }
      const sort = Utils.parseApiSortParameter(sortby);
      if (!sort.field) {
        return false;
      }
      const option = this.sortOptions.find(o => o.value === sort.field);
      if (!option) {
        return false;
      }
      this.sortTerm = option;
      this.sortOrder = sort.direction;
      return true;
    },
    resetSort() {
      if (!this.canSort) {
        return;
      }
      const defaults = this.type === 'Collections' ? this.defaultCollectionSort : this.defaultItemSort;
      const sort = Utils.parseApiSortParameter(defaults);
      if (sort.field) {
        const sortOption = this.sortOptions.find(option => option.value === sort.field);
        if (sortOption) {
          this.sortTerm = sortOption;
          this.sortOrder = sort.direction;
        }
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
