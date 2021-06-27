<template>
  <section class="links">
    <h2 v-if="title">{{ title }}</h2>
    <ul>
      <li v-for="link in links" :key="link.href">
        <a :href="link.href" target="_blank">{{ link.title || link.rel || link.href }}</a>
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  name: "Links",
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
