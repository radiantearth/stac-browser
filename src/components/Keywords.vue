<template>
  <p class="keywords d-flex flex-wrap">
    <b-badge v-for="keyword in keywords" :key="keyword" variant="secondary" class="mr-1 mb-1">{{ keyword }}</b-badge>
  </p>
</template>

<script>
export default {
    name: 'Keywords',
    props: {
        keywords: {
            type: Array,
            required: true
        }
    }
};
</script>