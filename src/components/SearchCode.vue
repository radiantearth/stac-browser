<template>
  <div class="search-code">
    <b-tabs v-model="selectedTab">
      <b-tab
        v-for="generator in generatorInstances"
        :key="generator.language"
        :title="generator.label"
        :id="generator.language"
      >
        <CodeBox
          v-if="selectedTab === generator.language"
          :generator="generator"
          :filters="filters"
        />
      </b-tab>
    </b-tabs>
    <b-form-radio-group
      v-if="availableMethods.length > 1"
      v-model="selectedMethod"
      :options="availableMethods"
      button-variant="outline-primary"
      size="sm"
      buttons
      class="mt-2"
    />
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import generators, { defaultGenerator } from '../../codeGenerators.config.js';
import BrowserStorage from '../browser-store';
import { mapState } from 'vuex/dist/vuex.cjs.js';

const TAB_STORAGE_KEY = 'codeLanguage';
const METHOD_STORAGE_KEY = 'codeMethod';

export default defineComponent({
  name: 'SearchCode',
  components: {
    BTabs,
    BTab,
    CodeBox: defineAsyncComponent(() => import('./CodeBox.vue'))
  },
  props: {
    searchLinks: {
      type: Object,
      required: true
    },
    filters: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      storage: new BrowserStorage(),
      selectedTab: null,
      selectedMethod: null
    };
  },
  computed: {
    ...mapState(['catalogUrl']),
    availableMethods() {
      return Object.keys(this.searchLinks);
    },
    activeSearchLink() {
      return this.searchLinks[this.selectedMethod] || Object.values(this.searchLinks)[0];
    },
    generatorInstances() {
      return generators.map(g => new g(this.catalogUrl, this.activeSearchLink));
    },
    defaultLanguage() {
      const defaultGen = new defaultGenerator(this.catalogUrl, this.activeSearchLink);
      const defGen = this.generatorInstances.find(g => g.language === defaultGen.language);
      return defGen?.language;
    }
  },
  created() {
    this.loadSelectedMethod();
    this.loadSelectedTab();
  },
  watch: {
    selectedTab(value) {
      this.saveSelectedTab(value);
    },
    selectedMethod(value) {
      this.storage.set(METHOD_STORAGE_KEY, value);
    }
  },
  methods: {
    loadSelectedMethod() {
      const saved = this.storage.get(METHOD_STORAGE_KEY);
      if (this.availableMethods.includes(saved)) {
        this.selectedMethod = saved;
      }
      else {
        this.selectedMethod = this.availableMethods[0];
      }
    },
    loadSelectedTab() {
      const saved = this.storage.get(TAB_STORAGE_KEY);
      if (this.generatorInstances.some(g => g.language === saved)) {
        this.selectedTab = saved;
        return;
      }
      if (this.defaultLanguage) {
        this.selectedTab = this.defaultLanguage;
      }
    },
    saveSelectedTab(language) {
      if (this.defaultLanguage !== language) {
        this.storage.set(TAB_STORAGE_KEY, language);
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
