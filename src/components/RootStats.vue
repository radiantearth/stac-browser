<template>
  <div class="root-stats">
    <Url v-if="rootUrl" id="stacUrl" :url="rootUrl" :label="$t('source.locatedAt')" />
    <template v-if="hasConformances">
      <h4>{{ $t('source.conformanceClasses') }}</h4>
      <dl v-for="(classes, group) in conformances" :key="group">
        <dt>{{ group }}</dt>
        <dd>
          <ul>
            <li v-for="(conf, uri) in classes" :key="uri" :title="uri">
              {{ conf.title }}
              <b-badge v-if="conf.version" pill variant="secondary" class="ms-1">{{ conf.version }}</b-badge>
            </li>
          </ul>
        </dd>
      </dl>
    </template>
    <template v-if="stats">
      <h4>{{ $t('source.statistics') }}</h4>
      <dl v-for="(group, key) in stats" :key="key">
        <dt>
          {{ group.label }}
          <b-badge pill variant="primary" class="ms-1">{{ group.count }}</b-badge>
          <b-badge v-if="group.version" pill variant="secondary" class="ms-1">{{ group.version }}</b-badge>
        </dt>
        <dd class="charts">
          <StatsChart v-if="group.extensions" type="extensions" :data="group.extensions" :count="group.count" />
          <StatsChart v-if="group.assets" type="assets" :data="group.assets" :count="group.count" />
          <StatsChart v-if="!group.version && group.versions" type="versions" :data="group.versions" :count="group.count" />
        </dd>
      </dl>
    </template>
  </div>
</template>

<script>
import { formatKey } from "@radiantearth/stac-fields/helper";
import { mapGetters, mapState } from "vuex";
import Url from './Url.vue';
import Utils from "../utils";
import { defineAsyncComponent } from 'vue';

export default {
  name: "RootStats",
  components: {
    StatsChart: defineAsyncComponent(() => import('./metadata/StatsChart.vue')),
    Url
  },
  computed: {
    ...mapState(['conformsTo']),
    ...mapGetters(['root']),
    rootUrl() {
      return this.root ? this.root.getAbsoluteUrl() : null;
    },
    hasConformances() {
      return Array.isArray(this.conformsTo) && this.conformsTo.length > 0;
    },
    conformances() {
      if (!this.hasConformances) {
        return null;
      }
      let obj = {
        OGC: {},
        STAC: {},
        Other: {} 
      };
      for(let uri of this.conformsTo) {
        let confClass =  this.parseConformance(uri);
        obj[confClass.type][uri] = confClass;
      }
      for (let key in obj) {
        if (Utils.size(obj[key]) === 0) {
          delete obj[key];
        }
      }
      return obj;
    },
    stats() {
      if (!this.root) {
        return null;
      }
      let stats = {
        'stats:catalogs': { label: this.$t('stacCatalog', 2) },
        'stats:collections': { label: this.$t('stacCollection', 2) },
        'stats:items': { label: this.$t('stacItem', 2) }
      };
      for (let key in stats) {
        if (Utils.isObject(this.root[key])) {
          let entry = Object.assign(stats[key], this.root[key]);
          if (Utils.size(entry['versions']) === 1) {
            entry.version = Object.keys(entry['versions'])[0];
            delete entry.versions;
          }
        }
        else {
          delete stats[key];
        }
      }
      return Utils.size(stats) > 0 ? stats : null;
    }
  },
  methods: {
    parseConformance(uri) {
      let title = uri;
      let type = 'Other';
      let version = null;
      if (uri.startsWith('http://www.opengis.net/spec/')) {
        type = 'OGC';
        let match = uri.match(/^http:\/\/www\.opengis\.net\/spec\/([^/]+)\/([^/]+)\/conf\/(.+)$/);
        if (match) {
          let [, spec, v, confClass] = match;
          version = v;
          let specs = spec.split('-');
          if (specs.length === 3 && specs[0] === 'ogcapi') {
            spec = `OGC API - ${formatKey(specs[1])} - Part ${specs[2]}`;
          }
          else if (spec === 'cql2') {
            spec = 'CQL2';
          }
          else {
            spec = formatKey(spec);
          }
          confClass = formatKey(confClass);
          title = `${spec} - ${confClass}`;
        }
      }
      else if (uri.startsWith('https://api.stacspec.org/')) {
        type = 'STAC';

        let match = uri.match(/^https?:\/\/api\.stacspec\.org\/([^/]+)\/([^/#]+)(?:#(.+))?$/);
        if (match) {
          version = match[1];
          title = formatKey(match[2]);
          if (match[3]) {
            title += ' - ' + formatKey(match[3]);
          }
        }
      }

      return { type, title, version };
    }
  }
};
</script>

<style lang="scss">
@import "../theme/variables.scss";

#stac-browser .root-stats {
  h4 {
    margin-top: $block-margin;
  }

  .charts .chart {
    max-height: 300px;
  }
  .metadata .card {
    margin-top: 0;
  }
  .metadata .card-columns {
    column-count: 1;
  }
}
</style>
