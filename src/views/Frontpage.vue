<template>
  <Page v-if="activeFrontpage" frontpage />
  <Browse v-else path="" />
</template>

<script>
import { defineAsyncComponent, defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import Page from './Page.vue';

export default defineComponent({
  name: "Frontpage",
  components: {
    Browse: defineAsyncComponent(() => import('./Browse.vue')),
    Page
  },
  computed: {
    ...mapGetters(['activeFrontpage'])
  }
});
</script>
