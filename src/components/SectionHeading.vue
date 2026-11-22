<template>
  <component :is="tag" :id="id" class="section-heading">
    <router-link v-if="id" :to="{ hash: '#' + id }"><slot /></router-link>
    <template v-else><slot /></template>
  </component>
</template>

<script>
export default {
  name: "SectionHeading",
  props: {
    tag: {
      type: String,
      default: "h2"
    },
    // Stable anchor id, e.g. "assets". Must be unique on the page,
    // so callers only pass it where the section renders once.
    // Without an id the heading renders as a plain heading.
    id: {
      type: String,
      default: null
    }
  }
};
</script>

<style lang="scss">
#stac-browser .section-heading {
  a {
    color: inherit;
    text-decoration: none;

    &:hover::after {
      content: " #";
      opacity: 0.5;
    }
  }
}
</style>
