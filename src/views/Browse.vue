<template>
  <main class="browse d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>{{ $t('errors.noExternalAccess') }}</b-alert>
    <ErrorAlert v-else-if="error" :url="url" :description="errorDescription" :id="errorId" />
    <Loading v-else-if="loading" stretch />
    <component v-else :is="component" />
  </main>
</template>

<script>
import Item from './Item.vue';
import Catalog from './Catalog.vue';
import { mapState } from 'pinia';
import { defineComponent } from 'vue';
import BrowseMixin from './BrowseMixin';
import { usePageStore } from '../store/page';

export default defineComponent({
  name: "Browse",
  components: {
    Catalog,
    Item
  },
  mixins: [
    BrowseMixin
  ],
  computed: {
    ...mapState(usePageStore, ['isItem']),
    component() {
      if (this.isItem) {
        return 'Item';
      }
      else {
        return 'Catalog';
      }
    }
  }
});
</script>
