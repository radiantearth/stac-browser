<template>
  <li class="page-item" :class="{ disabled: to === null }">
    <router-link v-if="to !== null" :to="to" class="page-link">{{
      name
    }}</router-link>
    <a v-else class="page-link">{{ name }}</a>
  </li>
</template>
<script>
export default {
  props: {
    to: {
      type: [String, null],
      default: null
    },
    name: {
      type: String,
      required: true
    }
  }
};
</script>
