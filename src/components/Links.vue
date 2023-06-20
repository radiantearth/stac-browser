<template>
  <section class="links mb-4">
    <h2 v-if="title">{{ title }}</h2>
    <template v-if="hasGroups">
      <div class="group" v-for="group in groups" :key="group.rel">
        <h4 v-if="group.rel">{{ group.label }}</h4>
        <ul>
          <Link v-for="(link, key) in group.links" :key="key" :link="link" :fallbackTitle="() => fallbackTitle(link)" />
        </ul>
      </div>
    </template>
    <ul v-else>
      <Link v-for="(link, key) in links" :key="key" :link="link" :fallbackTitle="() => fallbackTitle(link)" />
    </ul>
  </section>
</template>

<script>
import Link from './Link.vue';
import { Fields } from '@radiantearth/stac-fields';
import { formatKey } from '@radiantearth/stac-fields/helper';
import { ogcRelPrefix } from '../rels';
import Utils from '../utils';
import { translateFields } from '../i18n';
import { mapState } from 'vuex';


export default {
  name: "Links",
  components: {
    Link
  },
  props: {
    title: {
      type: String,
      default: null
    },
    links: {
      type: Array,
      default: () => ([])
    }
  },
  computed: {
    ...mapState(['uiLanguage']),
    groups() {
      let groups = this.links.reduce((summary, link) => {
        let rel = typeof link.rel === 'string' ? link.rel.toLowerCase() : "";
        if (rel in summary) {
          summary[rel].links.push(link);
        }
        else {
          summary[rel] = {
            rel: rel,
            label: this.formatRel(rel),
            links: [link]
          };
        }
        return summary;
      }, {});
      return Object.values(groups).sort((g1, g2) => g1.label.localeCompare(g2.label, this.uiLanguage));
    },
    hasGroups() {
      return this.groups.some(group => group.rel.length > 0 && group.links.length >= 2);
    }
  },
  methods: {
    formatRel(rel) {
      let lc = typeof rel === 'string' ? rel.toLowerCase() : "";
      if (lc in Fields.links.rel.mapping) {
        return translateFields(Fields.links.rel.mapping[lc]);
      }
      else {
        if (rel.startsWith(ogcRelPrefix)) {
          rel = rel.substr(ogcRelPrefix.length);
        }
        return formatKey(rel);
      }
    },
    fallbackTitle(link) {
      let title = Utils.titleForHref(link.href);
      if (this.hasGroups) {
        return title;
      }
      else {
        let rel = this.formatRel(link.rel);
        return `${rel}: ${title}`;
      }
    }
  }
};
</script>

<style lang="scss">
#stac-browser .links {
  ul {
    list-style-type: '-';
    margin: 0 0 1em 1em;
    padding: 0;

    > li {
      margin-bottom: 0.2em;
      padding-left: 0.5em;
    }
  }
}
</style>