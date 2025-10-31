<template>
  <b-offcanvas
    initial-animation id="sidebar" :model-value="modelValue" @update:model-value="emit"
    :title="$t('browse')" teleport-to="#stac-browser" footer-class="offcanvas-footer"
  >
    <template #default>
      <Loading v-if="loading" />
      <Tree v-else-if="root" :item="root" :path="parents" />
    </template>
    <template v-if="allowSelectCatalog" #footer>
      <b-button class="switch-catalog" variant="light">
        <router-link to="/"><b-icon-arrow-left-right /> {{ $t('sidebar.switchCatalog') }}</router-link>
      </b-button>
    </template>
  </b-offcanvas>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Loading from './Loading.vue';
import Tree from './Tree.vue';

export default {
  name: 'Sidebar',
  components: {
    Loading,
    Tree
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: true
    };
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'parents']),
    ...mapGetters(['root'])
  },
  watch: {
    modelValue: {
      immediate: true,
      async handler(visible) {
        if (visible) {
          try {
            this.loading = true;
            await this.$store.dispatch('loadParents');
          } finally {
            this.loading = false;
          }
        }

        if (visible) {
          document.body.classList.add("sidebar");
        }
        else {
          document.body.classList.remove("sidebar");
        }
      }
    },
    $route() {
      // Close sidebar when route changes
      this.emit(false);
    }
  },
  methods: {
    emit(value) {
      this.$emit('update:modelValue', value);
    }
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
  background-color: $light;

  @include media-breakpoint-down(sm) {
    width: 100%;
    min-width: 100px;
    max-width: 100%;
  }

  .offcanvas-header {
    padding: 0.5rem 1rem;

    .offcanvas-title {
      font-size: 1.5rem;
    }
  }

  .offcanvas-body {
    padding: 0.5rem 1rem;

    .tree {
      &.root {
        margin: 0;
        padding: 0;
      }
    }
  }

  .offcanvas-footer {
    border-top: 1px solid rgba(0,0,0,.125);

    .switch-catalog {
      width: 100%;
    }
  }
}

</style>
