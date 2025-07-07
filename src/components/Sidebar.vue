<template>
  <b-sidebar id="sidebar" v-model="visible" :title="$t('browse')" backdrop>
    <template #default>
      <Loading v-if="loading" />
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
import { STAC } from "stac-js";
import { mapActions } from "vuex/dist/vuex.common.js";

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
      visible: false,
      loading: true
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'data']),
    ...mapGetters(['getStac', 'root']),
    parents() {
      const parents = [];
      let stac = this.data;
      while (stac instanceof STAC) {
        const parentLink = stac.getLinkWithRel('parent') || stac.getLinkWithRel('root');
        if (!parentLink) {
          break;
        }
        const parentStac = this.getStac(parentLink.getAbsoluteUrl());
        if (!parentStac) {
          parents.push(parentLink);
        }
        else if (parentStac === stac) {
          // Avoid inifinite loops
          break;
        }
        else {
          parents.push(parentStac);
        }
        stac = parentStac;
      }
      return parents;
    },
  },
  watch: {
    visible: {
      immediate: true,
      async handler(visible) {
        if (visible) {
          await this.loadParents();
        }

        if (visible) {
          document.body.classList.add("sidebar");
        }
        else {
          document.body.classList.remove("sidebar");
        }
      }
    }
  },
  methods: {
    ...mapActions(['load']),
    async loadParents() {
      this.loading = true;
      let stac = this.data;
      while (stac instanceof STAC) {
        const parentLink = stac.getLinkWithRel('parent') || stac.getLinkWithRel('root');
        if (!parentLink) {
          break;
        }
        const url = parentLink.getAbsoluteUrl();
        let parentStac = this.getStac(url);
        if (!parentStac) {
          await this.load({ url });
          parentStac = this.getStac(url);
        }
        if (parentStac.equals(stac)) {
          break;
        }
        stac = parentStac;
      }
      this.loading = false;
    },
  }
};
</script>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser #sidebar {
  width: 50%;
  min-width: 400px;
  max-width: 600px;
  padding-top: $header-margin;

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

@include media-breakpoint-down(sm) {
  body.sidebar {
    overflow: hidden;
  }

  #stac-browser #sidebar {
    width: 100%;
    max-width: 100%;
  }
}
</style>
