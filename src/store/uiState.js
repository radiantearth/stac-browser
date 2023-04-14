import Vue from 'vue';
import Utils from '../utils';

function getDefaults() {
  return {
    language: null,
    asset: [],
    itemdef: [],
    s_datetime: [],
    s_bbox: [],
    s_limit: Number.NaN,
    s_ids: [],
    s_collections: [],
    s_sortby: null,
    s_filters: []
  }
}

function toQuery(key, value) {
  if (!Utils.isEmpty(value)) {
    if (Array.isArray(value)) {
      if (key === 's_filters') {
        value = JSON.stringify(value.map(f => [f.id, f.data.operator, f.data.value]));
      }
      else {
        if (key === 's_datetime') {
          value = value.map(dt => Utils.dateToUTC(dt).toISOString());
        }
        value = value.join(',');
      }
    }
    else if (typeof value === 'number') {
      value = String(value);
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  else if (!Utils.isEmpty(value)) {
    console.warn(`UI state parameter '${key}' hasn't been serialized to a string, is: ${typeof value}`, value);
  }
}

export default {
  namespaced: true,
  state: getDefaults(),
  getters: {
    all(state) {
      return state;
    },
    query(state) {
      let query = {};
      for (let key in state) {
        let value = toQuery(key, state[key]);
        if (typeof value !== 'undefined') {
          query[`.${key}`] = value;
        }
      }
      return query;
    },
    searchFilters(state) {
      let obj = {};
      for(let key in state) {
        let value = state[key];
        if (key.startsWith('s_') && !Utils.isEmpty(value)) {
          obj[key.substring(2)] = state[key];
        }
      }
      return obj;
    },
    shouldCollapsibleOpen: (state) => (type, id) => {
      return state[type].indexOf(id) !== -1;
    }
  },
  mutations: {
    // public setters
    setLanguage(state, locale) {
      state.language = locale;
    },
    setSearchFilters(state, filters) {
      for (let key in filters) {
        state[`s_${key}`] = filters[key];
      }
    },
    toggleCollapsible(state, { type, uid, visible }) {
      const idx = state[type].indexOf(uid);
      if (idx === -1 && visible) {
        state[type].push(uid);
      }
      else if (!visible) {
        Vue.delete(state[type], idx);
      }
    },
    // set from a query, parses values
    set(state, { key, value }) {
      if (key.startsWith('.')) {
          key = key.substring(1);
      }

      if (typeof value === 'string') {
        let base = state[key];
        if (Array.isArray(base)) {
          value = value.split(',');
          if (key === 's_bbox') {
            value = value.map(n => parseFloat(n));
          }
          else if (key === 's_datetime') {
            value = value.map(dt => new Date(Date.parse(dt)));
          }
          else if (key === 's_filters') {
            value = JSON.parse(value).map(f => ({id: f[0], data: { operator: f[1], value: f[2] }}));
          }
        }
        else if (typeof base === 'number') {
          try {
            value = parseFloat(value);
          } catch (error) {}
        }
      }

      Vue.set(state, key, value);
    },
    // set from internal state, doesn't parse values
    setAll(state, newState) {
      Object.assign(state, newState);
    },
    // reset internal state
    reset(state) {
      Object.assign(state, getDefaults());
    }
  }
};