<template>
  <section class="links mb-4">
    <h2 v-if="title">{{ title }}</h2>
    <ul>
      <li v-for="(link, key) in links" :key="key">
        <StacLink :data="link" :fallbackTitle="() => fallbackTitle(link)" />
      </li>
    </ul>
  </section>
</template>

<script>
import StacLink from './StacLink.vue';
import { links } from '@radiantearth/stac-fields/fields.json';
import Utils from '../utils';

export default {
  name: "Links",
  components: {
    StacLink
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
  methods: {
    fallbackTitle(link) {
      let rel = link.rel;
      if (rel in links.rel.mapping) {
        rel = links.rel.mapping[rel];
      }
      let title = Utils.titleForHref(link.href);
      return `${rel} (${title})`
    }
  }
};
</script>

<style lang="scss">
#stac-browser .links {
  > ul {
    list-style-type: none;
    margin: 0;
    padding: 0;

    > li {
      margin-bottom: 0.2em;
    }
  }
}
</style>