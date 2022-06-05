<template>
  <div class="sidebar">
    <div v-if="!parents" class="loading text-center">
      <b-spinner label="Loading..." />
    </div>
    <Tree v-else-if="root" :item="root" :path="parents" />

    <b-button v-if="allowSelectCatalog" class="mt-4" variant="light"><router-link to="/"><b-icon-arrow-left-right /> Switch Catalog</router-link></b-button>
  </div>
</template>

<script>
import { BIconArrowLeftRight } from "bootstrap-vue";
import { mapGetters, mapState } from 'vuex';
import Tree from './Tree.vue';

export default {
  name: 'Sidebar',
  components: {
    BIconArrowLeftRight,
    Tree
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'parents']),
    ...mapGetters(['root'])
  },
  async created() {
    await this.$store.dispatch('loadParents');
  }
};
</script>

<style lang="scss" scoped>
.sidebar {
  padding: 0.5rem 1rem;

  .tree.root {
    margin: 0;
    padding: 0;
  }

  > button {
    width: 100%;
  }
}
</style>