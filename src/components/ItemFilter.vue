<template>
  <b-form class="filter mb-4" @submit.stop.prevent="onSubmit" @reset="onReset">
    <b-card no-body :title="title">
      <b-card-body>
        <Loading v-if="!loaded" fill />

        <b-card-title v-if="title" :title="title" />

        <b-form-group v-if="canFilterExtents" :label="$t('search.temporalExtent')" label-for="datetime" :description="$t('search.dateDescription')">
          <date-picker
            range id="datetime" :lang="datepickerLang" :format="datepickerFormat"
            :value="query.datetime" @input="setDateTime" input-class="form-control mx-input"
          />
        </b-form-group>

        <b-form-group v-if="canFilterExtents" :label="$t('search.spatialExtent')" label-for="provideBBox">
          <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">{{ $t('search.filterBySpatialExtent') }}</b-form-checkbox>
          <Map class="mb-4" v-if="provideBBox" :stac="stac" selectBounds @bounds="setBBox" scrollWheelZoom />
        </b-form-group>

        <b-form-group v-if="!collectionOnly" :label="$tc('stacCollection', collections.length)" label-for="collections">
          <multiselect
            v-if="collections.length > 0"
            id="collections" :value="selectedCollections" @input="setCollections"
            :placeholder="$t('search.selectCollections')"
            :tagPlaceholder="$t('search.addCollections')"
            :selectLabel="$t('multiselect.selectLabel')"
            :selectedLabel="$t('multiselect.selectedLabel')"
            :deselectLabel="$t('multiselect.deselectLabel')"
            :limitText="limitText"
            :options="collections" multiple track-by="value" label="text"
          />
          <multiselect
            v-else
            id="collections" :value="selectedCollections" @input="setCollections"
            multiple taggable :options="query.collections"
            :placeholder="$t('search.enterCollections')"
            :tagPlaceholder="$t('search.addCollections')"
            :selectLabel="$t('multiselect.selectLabel')"
            :selectedLabel="$t('multiselect.selectedLabel')"
            :deselectLabel="$t('multiselect.deselectLabel')"
            :limitText="limitText"
            @tag="addCollection"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
          </multiselect>
        </b-form-group>

        <b-form-group v-if="!collectionOnly" :label="$t('search.itemIds')" label-for="ids">
          <multiselect
            id="ids" :value="query.ids" @input="setIds"
            multiple taggable :options="query.ids"
            :placeholder="$t('search.enterItemIds')"
            :tagPlaceholder="$t('search.addItemIds')"
            :noOptions="$t('search.addItemIds')"
            @tag="addId"
          >
            <template #noOptions>{{ $t('search.noOptions') }}</template>
          </multiselect>
        </b-form-group>

        <div class="additional-filters" v-if="canFilterCql && Array.isArray(queryables) && queryables.length > 0">
          <b-form-group :label="$t('search.additionalFilters')" label-for="availableFields">
            <b-alert variant="warning" show>{{ $t('featureExperimental') }}</b-alert>

            <b-dropdown size="sm" :text="$t('search.addFilter')" block variant="primary" class="mt-2 mb-3" menu-class="w-100">
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

        <b-form-group v-if="canSort" :label="$t('sort.title')" label-for="sort" :description="$t('search.notFullySupported')">
          <multiselect
            id="sort" :value="sortTerm" @input="sortFieldSet"
            :options="sortOptions" track-by="value" label="text"
            :placeholder="$t('default')"
            :selectLabel="$t('multiselect.selectLabel')"
            :selectedLabel="$t('multiselect.selectedLabel')"
            :deselectLabel="$t('multiselect.deselectLabel')"
          />
          <SortButtons v-if="sortTerm" class="mt-1" :value="sortOrder" enforce @input="sortDirectionSet" />
        </b-form-group>

        <b-form-group :label="$t('search.itemsPerPage')" label-for="limit" :description="$t('search.itemsPerPageDescription', {maxItems})">
          <b-form-input
            id="limit" :value="query.limit" @change="setLimit" min="1"
            :max="maxItems" type="number"
            :placeholder="$t('defaultWithValue', {value: itemsPerPage})"
          />
        </b-form-group>
      </b-card-body>
      <b-card-footer>
        <b-button type="submit" variant="primary">{{ $t('search.buttons.filter') }}</b-button>
        <b-button type="reset" variant="danger" class="ml-3">{{ $t('search.buttons.reset') }}</b-button>
      </b-card-footer>
    </b-card>
  </b-form>
</template>

<script>
import { BDropdown, BDropdownItem, BForm, BFormGroup, BFormInput, BFormCheckbox } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';

import { mapGetters, mapState } from "vuex";
import DatePickerMixin from './DatePickerMixin';
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
    QueryableInput: () => import('./QueryableInput.vue'),
    Loading,
    Map: () => import('./Map.vue'),
    SortButtons: () => import('./SortButtons.vue'),
    Multiselect
  },
  mixins: [
    DatePickerMixin
  ],
  props: {
    stac: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    value: {
      type: Object,
      default: () => ({})
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
      maxItems: 10000,
      provideBBox: false,
      query: this.getDefaultValues(),
      loaded: false,
      selectedCollections: []
    };
  },
  computed: {
    ...mapState(['itemsPerPage', 'uiLanguage', 'queryables', 'apiCollections']),
    ...mapGetters(['hasMoreCollections', 'root']),
    sortOptions() {
      return [
        { value: null, text: this.$t('default') },
        { value: 'properties.datetime', text: this.$t('search.sortOptions.datetime') },
        { value: 'id', text: this.$t('search.sortOptions.id') },
        { value: 'properties.title', text: this.$t('search.sortOptions.title') }
      ];
    },
    collections() {
      if (this.hasMoreCollections || this.collectionOnly) {
        return [];
      }
      return this.apiCollections
        .map(c => ({
          value: c.id,
          text: c.title || c.id
        }))
        .sort((a,b) => a.text.localeCompare(b.text, this.uiLanguage));
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
    limitText(count) {
      return this.$t("multiselect.andMore", {count});
    },
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
      if (this.canSort && this.sortTerm && this.sortOrder) {
        this.$set(this.query, 'sortby', this.formatSort());
      }
      this.$emit('input', this.query, false);
    },
    async onReset() {
      this.query = this.getDefaultValues();
      this.$emit('input', {}, true);
    },
    setLimit(limit) {
      limit = Number.parseInt(limit, 10);
      if (limit > this.maxItems) {
        limit = this.maxItems;
      }
      else if (limit < 0) {
        limit = null;
      }
      this.$set(this.query, 'limit', limit);
    },
    setBBox(bounds) {
      let bbox = null;
      if (this.provideBBox) {
        bbox = bounds;
      }
      this.$set(this.query, 'bbox', bbox);
    },
    setDateTime(datetime) {
      if (datetime.find(dt => dt instanceof Date)) {
        datetime = datetime.map(Utils.dateToUTC);
      }
      else {
        datetime = null;
      }
      this.$set(this.query, 'datetime', datetime);
    },
    addCollection(collection) {
      this.selectedCollections.push(collection);
      this.query.collections.push(collection);
    },
    setCollections(collections) {
      this.selectedCollections = collections;
      this.$set(this.query, 'collections', collections.map(c => c.value));
    },
    addId(id) {
      this.query.ids.push(id);
    },
    setIds(ids) {
      this.$set(this.query, 'ids', ids);
    },
    formatSort() {
      if (this.sortTerm && this.sortOrder) {
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

<style src=""></style>

<style lang="scss">
@import '../theme/variables.scss';

// Datepicker related style
$default-color: map-get($theme-colors, "secondary");
$primary-color: map-get($theme-colors, "primary");

@import '~vue2-datepicker/scss/index.scss';

// Multiselect related style
@import '~vue-multiselect/dist/vue-multiselect.min.css';
#stac-browser {
  .multiselect__tags:focus-within {
    border-color: #48cce1;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(24, 129, 145, 0.25);
  }

  .multiselect__select:before {
    color: #495057;
    border-color: #495057 transparent transparent;
  }
  
  .multiselect__tags,
  .multiselect__single {
    border-color: #ced4da;
    padding-left: 0.75rem;
    font-size: 16px;
  }

  .multiselect__input,
  .multiselect__single {
    padding: 4px 0 3px 0;
  }

  .multiselect__tag,
  .multiselect__tag-icon:hover,
  .multiselect__option--highlight,
  .multiselect__option--highlight:after {
    background-color: map-get($theme-colors, "primary");
  }

  .multiselect__option--selected.multiselect__option--highlight,
  .multiselect__option--selected.multiselect__option--highlight:after {
    background-color: map-get($theme-colors, "secondary");
  }

  .multiselect__placeholder {
    color: #999;
    font-size: 16px;
  }
}

// General item filter style
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