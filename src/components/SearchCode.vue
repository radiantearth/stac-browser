<template>
  <div class="search-code">
    <b-tabs v-model="selectedTab">
      <b-tab
        v-for="generator in generatorInstances"
        :key="generator.language"
        :title="generator.label"
        :id="generator.language"
      >
        <CodeBox :generator="generator" :filters="filters" />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { BTabs, BTab } from 'bootstrap-vue-next';
import generators, { defaultGenerator } from '../../codeGenerators.config.js';
import BrowserStorage from '../browser-store';
import { mapState } from 'vuex/dist/vuex.cjs.js';

const STORAGE_KEY = 'codeLanguage';

export default defineComponent({
  name: 'SearchCode',
  components: {
    BTabs,
    BTab,
    CodeBox: defineAsyncComponent(() => import('./CodeBox.vue'))
  },
  props: {
    searchLink: {
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
      selectedTab: null
    };
  },
  computed: {
    ...mapState(['catalogUrl']),
    generatorInstances() {
      return generators.map(g => new g(this.catalogUrl, this.searchLink));
    },
    defaultLanguage() {
      const defaultGen = new defaultGenerator(this.catalogUrl, this.searchLink);
      const defGen = this.generatorInstances.find(g => g.language === defaultGen.language);
      return defGen?.language;
    }
  },
  created() {
    this.loadSelectedTab();
    console.log(this.selectedTab);
  },
  watch: {
    selectedTab(value) {
      this.saveSelectedTab(value);
    }
  },
  methods: {
    loadSelectedTab() {
      const saved = this.storage.get(STORAGE_KEY);
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
        this.storage.set(STORAGE_KEY, language);
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
