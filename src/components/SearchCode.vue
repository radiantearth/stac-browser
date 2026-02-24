<template>
  <div class="search-code">
    <b-tabs v-model:index="internalTab">
      <b-tab v-for="gen in generators" :key="gen.language" :title="gen.label">
        <CodeBox :code="getCode(gen)" :language="gen.language" />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import { generators, generateCode } from '../codegen/index.js';

const STORAGE_KEY = 'stac-browser:codeLanguage';

export default defineComponent({
  name: 'SearchCode',
  emits: ['update:activeCode'],
  components: {
    BTabs,
    BTab,
    CodeBox: defineAsyncComponent(() => import('./CodeBox.vue'))
  },
  props: {
    catalogHref: {
      type: String,
      required: true
    },
    filters: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      generators,
      internalTab: this.loadSelectedTab()
    };
  },
  mounted() {
    this.emitActiveCode(this.internalTab);
  },
  watch: {
    internalTab(value) {
      this.saveSelectedTab(value);
      this.emitActiveCode(value);
    },
    filters: {
      deep: true,
      handler() {
        this.emitActiveCode(this.internalTab);
      }
    },
    catalogHref() {
      this.emitActiveCode(this.internalTab);
    }
  },
  methods: {
    getCode(GeneratorClass) {
      return generateCode(GeneratorClass, this.catalogHref, this.filters);
    },
    getTabIndex(value) {
      const index = Number.parseInt(value, 10);
      if (Number.isInteger(index) && index >= 0 && index < this.generators.length) {
        return index;
      }
      return 0;
    },
    emitActiveCode(value) {
      const index = this.getTabIndex(value);
      const generator = this.generators[index] || this.generators[0];
      if (generator) {
        this.$emit('update:activeCode', this.getCode(generator));
      }
    },
    loadSelectedTab() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          const index = parseInt(saved, 10);
          if (index >= 0 && index < generators.length) {
            return index;
          }
        }
      }
      catch {
        // localStorage unavailable
      }
      return 0; // Default to Python
    },
    saveSelectedTab(value) {
      const index = this.getTabIndex(value);
      try {
        localStorage.setItem(STORAGE_KEY, String(index));
      }
      catch {
        // localStorage unavailable
      }
    }
  }
});
</script>

<style scoped>
.search-code :deep(.tab-pane) {
  padding-top: 1rem;
}
</style>
