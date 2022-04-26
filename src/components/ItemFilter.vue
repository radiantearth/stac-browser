<template>
  <section class="filter mb-4">
    <h4 v-if="title">{{ title }}</h4>
    <b-form @submit.stop.prevent="onSubmit" @reset="onReset">
      <b-form-group label="Temporal Extent" label-for="datetime">
        <date-picker id="datetime" :value="filters.datetime" @input="setDateTime" range input-class="form-control mx-input"></date-picker>
      </b-form-group>

      <b-form-group label="Spatial Extent" label-for="provideBBox">
        <b-form-checkbox id="provideBBox" v-model="provideBBox" value="1" @change="setBBox">Filter by spatial extent</b-form-checkbox>
        <Map class="mb-4" v-if="provideBBox" :stac="stac" :selectBounds="true" @bounds="setBBox" />
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Collections" label-for="collections">
        <b-form-tags input-id="collections" :value="filters.collections" @input="setCollections" separator=" ,;" remove-on-delete add-on-change placeholder="List one or multiple collections..."></b-form-tags>
      </b-form-group>

      <b-form-group v-if="!collectionOnly" label="Item IDs" label-for="ids">
        <b-form-tags input-id="ids" :value="filters.ids" @input="setIds" separator=" ,;" remove-on-delete add-on-change placeholder="List one or multiple Item IDs..."></b-form-tags>
      </b-form-group>

      <b-form-group v-if="sort" label="Sort" label-for="sort" description="Some APIs may not support all of the options.">
        <b-form-select id="sort" v-model="sortTerm" :options="sortOptions" placeholder="Default"></b-form-select>
        <SortButtons class="mt-1" v-model="sortOrder" enforce />
      </b-form-group>

      <b-form-group label="Items per page" label-for="limit" :description="`Number of items requested per page, max. ${maxItems} items.`">
        <b-form-input id="limit" :value="filters.limit" @change="setLimit" min="1" :max="maxItems" type="number" :placeholder="`Default (${itemsPerPage})`"></b-form-input>
      </b-form-group>

      <div class="additionalFilters">
        <b-form-group label="Select additional field filters" label-for="availableFields" description="Fields advertised by the queryables endpoint">
          <b-form-select id="availableFields" :value="selectedQueryable" size="sm" @input="additionalFieldSelected" :options="fieldFilterOptions">
            <template #first>
              <b-form-select-option :value="null" disabled>-- Please select an option --</b-form-select-option>
            </template>
          </b-form-select>
        </b-form-group>

        <b-row 
          v-for="(item) in userDefinedFilters"
          :key="item.queryable.id"
        >
          <b-col cols="4">
            {{item.queryable.usableDefinition.title}}
          </b-col>
          <b-col v-if="item.operator !== null" cols="2">
            <b-form-select v-model="item.operator" size="sm" @input="queryableSet(item, $event)" :options="item.queryable.operatorOptions">
            </b-form-select>     
          </b-col>
          <b-col :cols="item.operator !== null ? 5 : 7">
            <component :is="item.component" v-bind="item.props" @input="queryableSet(item, $event)"/>
          </b-col>
          <b-col cols="1">
            <b-button size="sm" class="mb-2" variant="danger" style="float: right;">
              <b-icon icon="x-circle-fill" aria-hidden="true" @click="removeUserFilterField(item)"></b-icon>
            </b-button>
          </b-col>
        </b-row>


      </div>

      <b-button type="submit" variant="primary">Filter</b-button>
      <b-button type="reset" variant="danger" class="ml-3">Reset</b-button>
    </b-form>
  </section>
</template>

<script>
import { BForm, BFormGroup, BFormInput, BFormCheckbox, BFormSelect, BFormSelectOption, BFormTags, BButton, BIcon, BIconXCircleFill } from 'bootstrap-vue';

import DatePicker from 'vue2-datepicker';
import { mapState } from "vuex";
import Queryable from '../models/Queryable'

export default {
  name: 'ItemFilter',
  components: {
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
      selectedQueryable: null,
      queryables: [],
      userDefinedFilters: [],
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
      return this.queryables.map(q => {
          return { value: q.field, text: q.usableDefinition.title }
      })
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
        if (this.sort && typeof filters.sortby === 'string') {
          this.sortOrder = filters.sortby.startsWith('-') ? -1 : 1;
          this.sortTerm = filters.sortby.replace(/^(\+|-)/, '');
        }
        this.filters = filters;
      }
    }
  },
  methods: {
    queryableSet (item, event) {
      item.props.value = event
      // console.log('something changed', item, event)
    },
    removeUserFilterField (item) {
      this.userDefinedFilters.splice(this.userDefinedFilters.findIndex(i => i.id === item.id), 1)
    },
    getComponentForQueryable (queryable) {
      if (queryable.uiType === 'selectField') return BFormSelect
     return BFormInput
    },
    getComponentPropsForQueryable (queryable)  {
      if (queryable.uiType === 'textField') {
        return {
          value: '',
          size: 'sm'
        }
      }
      if (queryable.uiType === 'selectField') {
        return {
          value: queryable.usableDefinition.enum[0],
          options: queryable.usableDefinition.enum,
          size: 'sm'
        }
      } else if (queryable.uiType === 'numberField') {
        const d = {
          value: 0,
          type: 'number',
          size: 'sm'
        }
        if (queryable.usableDefinition.minimum) {
          d.value = queryable.usableDefinition.minimum
          d.min = queryable.usableDefinition.minimum
        }
        if (queryable.usableDefinition.maximum) d.max = queryable.usableDefinition.maximum
        return d
      } else if (queryable.uiType === 'rangeField') {
        return {
          value: 0,
          type: 'range',
          min: queryable.usableDefinition.minimum,
          max: queryable.usableDefinition.maximum
        }
      }
    },
    additionalFieldSelected (value) {
      const queryable = this.queryables.find(q => q.id === value)
      this.userDefinedFilters.push({
        queryable,
        component: this.getComponentForQueryable(queryable),
        props: this.getComponentPropsForQueryable(queryable),
        operator: queryable.operatorOptions !== null ? queryable.operatorOptions[0] : null
      })
      // Note this doesn't seem to clear the UI component, think it's a bug in vue-bootstrap
      this.selectedQueryable = null
    },
    getDefaultValues() {
      return {
        datetime: null,
        bbox: null,
        limit: null,
        ids: [],
        collections: [],
        sortby: null
      };
    },
    onSubmit() {
      if (this.sort) {
        this.filters.sortby = this.formatSort();
      }

      if (this.userDefinedFilters.length > 0) {
        const otherFilters = this.userDefinedFilters.map(f => f.queryable.getAsCql2Json(f.operator, f.props.value))
        console.log(otherFilters)
      }
      console.log(this.filters)
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
  },
  async mounted () {
    if (this.stac.type === 'Collection') {
      const rawQueryables = await this.stac.getQueryables()
      const keys = Object.keys(rawQueryables)
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const q = new Queryable(key, rawQueryables[key])
        await q.init()
        this.queryables.push(q)
      }
      console.log(this.queryables)
    }
  }
}
</script>

<style lang="scss">
@import '../theme/variables.scss';

$default-color: map-get($theme-colors, "secondary");
$primary-color: map-get($theme-colors, "primary");

@import '~vue2-datepicker/scss/index.scss';

.mx-datepicker {
  width: 100%;
}

.additionalFilters {
  background: #f0f0f0;
  border: 1px solid #cccccc;
  border-radius: 0.25rem;
  padding: 20px;
  margin-bottom: 20px;;
}
</style>