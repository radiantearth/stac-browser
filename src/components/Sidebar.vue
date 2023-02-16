<template>
  <b-sidebar id="sidebar" v-model="visible" :title="$t('browse')" backdrop lazy>
    <template #default>
      <Loading v-if="!parents" />
      <Tree v-else-if="root" :item="root" :path="parents" />
    </template>
    <template v-if="allowSelectCatalog" #footer>
      <b-button class="switch-catalog" variant="light">
        <router-link to="/"><b-icon-arrow-left-right /> {{ $t('sidebar.switchCatalog') }}</router-link>
      </b-button>
    </template>
  </b-sidebar>
</template>

<script>
import { BIconArrowLeftRight, BSidebar } from "bootstrap-vue";
import { mapGetters, mapState } from 'vuex';
import Loading from './Loading.vue';
import Tree from './Tree.vue';

export default {
  name: 'Sidebar',
  components: {
    BIconArrowLeftRight,
    BSidebar,
    Loading,
    Tree
  },
  data() {
    return {
      visible: false
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'parents']),
    ...mapGetters(['root'])
  },
  watch: {
    visible: {
      immediate: true,
      async handler(visible) {
        if (visible) {
          await this.$store.dispatch('loadParents');
        }
      }
    }
  },
  mounted() {
    this.visible = true;
  }
};
</script>

<style lang="scss">
#stac-browser #sidebar {
  width: 33%;
  min-width: 300px;

  .b-sidebar-body {
    padding: 0.5rem 1rem;

    .tree.root {
      margin: 0;
      padding: 0;
    }
  }
  .b-sidebar-footer {
    border-top: 1px solid rgba(0,0,0,.125);

    .switch-catalog {
      width: 100%;
    }
  }
}
</style>