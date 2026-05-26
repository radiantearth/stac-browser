<template>
  <b-offcanvas
    initial-animation id="sidebar" :model-value="modelValue" @update:model-value="emit"
    :title="$t('browse')" teleport-to="#stac-browser" footer-class="offcanvas-footer"
  >
    <template #default>
      <Loading v-if="loading" />
      <template v-else-if="root">
        <multiselect
          v-if="allKeywords.length > 0"
          v-model="selectedKeywords"
          :options="allKeywords"
          multiple
          class="mb-2"
          :placeholder="$t('multiselect.keywordsPlaceholder')"
          :select-label="$t('multiselect.selectLabel')"
          :selected-label="$t('multiselect.selectedLabel')"
          :deselect-label="$t('multiselect.deselectLabel')"
          :limit-text="count => $t('multiselect.andMore', { count })"
        />
        <Tree :item="root" :path="parents" :selectedKeywords="selectedKeywords" @update:keywords="allKeywords = $event" />
      </template>
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
import { defineAsyncComponent } from 'vue';
import Loading from './Loading.vue';
import Tree from './Tree.vue';
import { BOffcanvas } from 'bootstrap-vue-next';

export default {
  name: 'Sidebar',
  components: {
    Loading,
    Tree,
    BOffcanvas,
    Multiselect: defineAsyncComponent(() => import('vue-multiselect'))
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
      loading: true,
      selectedKeywords: [],
      allKeywords: []
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
@import 'bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser #sidebar {
  width: 50%;
  min-width: 400px;
  max-width: 600px;
  padding-top: var(--sb-header-margin);
  background-color: $light;
  
  [data-bs-theme="dark"] & {
    background-color: $dark;
  }

  @include media-breakpoint-down(md) {
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
    border-top: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);

    .switch-catalog {
      width: 100%;
      border-radius: 0;
    }
  }
}
</style>
