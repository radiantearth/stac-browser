<template>
  <ul>
    <li v-for="link in links" :key="link.href">
      <a :href="link.href" target="_blank">{{ link.title || link.rel || link.href }}</a>
    </li>
  </ul>
</template>

<script>
export default {
  name: "Links",
  props: {
    links: {
      type: Array,
      default: () => ([])
    }
  }
};
</script>
