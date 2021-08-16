<template>
  <section class="links mb-4">
    <h2 v-if="title">{{ title }}</h2>
    <ul>
      <li v-for="(link, i) in links" :key="i">
        <StacLink :link="link" />
      </li>
    </ul>
  </section>
</template>

<script>
import StacLink from './StacLink.vue';

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
  }
};
</script>
