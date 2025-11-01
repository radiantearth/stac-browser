<template>
  <b-dropdown size="sm" variant="primary" right :title="$t('source.language.switch')">
    <template #button-content>
      <b-icon-flag /><span class="button-label">{{ $t('source.language.label', {currentLanguage}) }}</span>
    </template>
    <b-dropdown-item v-for="l of languages" :key="l.code" class="lang-item" @click="setLocale(l.code)">
      <b-icon-check :class="{hide: currentLocale !== l.code}" />
      <span class="title">
        <span :lang="l.code">{{ l.native }}</span>
        <template v-if="l.global && l.global !== l.native"> / <span lang="en">{{ l.global }}</span></template>
      </span>
      <b-icon-exclamation-triangle v-if="supportsLanguageExt && (!l.ui || !l.data)" :title="l.ui ? $t('source.language.onlyUI') : $t('source.language.onlyData')" class="ms-2" />
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>

import { STAC } from 'stac-js';
import { getBest, prepareSupported } from 'stac-js/src/locales';

import { BDropdown, BDropdownItem } from 'bootstrap-vue-next';

import { getDataLanguages } from '../i18n';
import Utils, { languageExtension } from '../utils';

export default {
  name: 'LanguageChooser',
  components: {
    BDropdown,
    BDropdownItem,
  },
  props: {
    data: {
      type: Object,
      default: null
    },
    locales: {
      type: Array,
      default: () => []
    },
    currentLocale: {
      type: String,
      required: true
    }
  },
  emits: ['setLocale'],
  computed: {
    dataLanguages() {
      let dataLanguages = [];
      if (this.data instanceof STAC) {
        const languages = this.data.getMetadata('languages');
        // Ensure the other languages are always an array
        if (Array.isArray(languages) && languages.length > 0) {
          dataLanguages = languages.slice();
        }
        // Add the current language of the data to the list of languages
        // No need to check the language as checks will be done in the filter below
        dataLanguages.unshift(this.data.getMetadata('language'));
      }
      // Filter out invalid languages
      return dataLanguages.filter(lang => Utils.isObject(lang) && typeof lang.code === 'string');
    },
    supportsLanguageExt() {
      return this.data instanceof STAC && this.data.supportsExtension(languageExtension);
    },
    currentLanguage() {
      let lang = this.languages.find(l => l.code === this.currentLocale);
      if (lang) {
        return lang.native;
      }
      else {
        return '-';
      }
    },
    languages() {
      let languages = [];

      // Add all UI languages
      for(let code of this.locales) {
        const t_key = `languages.${code}.transliteration`;
        languages.push({
          code,
          native: this.$t(`languages.${code}.native`),
          global: this.$t(`languages.${code}.global`),
          transliteration: this.$te(t_key) ? this.$t(t_key) : null,
          ui: true
        });
      }

      // Add missing data languages
      const dataLanguages = getDataLanguages(this.data);
      for(let lang of dataLanguages) {
        if (!Utils.isObject(lang) || !lang.code || this.locales.includes(lang.code)) {
          continue;
        }
        let newLang = {
          code: lang.code
        };
        newLang.native = lang.name || lang.alternate || lang.code;
        newLang.global = lang.alternate || lang.name || lang.code;
        newLang.data = true;
        languages.push(newLang);
      }

      if (this.supportsLanguageExt) {
        // Determine which languages are complete
        const uiSupported = prepareSupported(this.locales);
        const dataSupported = prepareSupported(dataLanguages.map(l => l.code));
        for(let l of languages) {
          if (!l.ui) {
            l.ui = Boolean(getBest(uiSupported, l.code, null));
          }
          if (!l.data) {
            l.data = Boolean(getBest(dataSupported, l.code, null));
          }
        }
      }
      
      const collator = new Intl.Collator('en', { sensitivity: 'base' });
      return languages.sort((a,b) => {
        return collator.compare(
          a.transliteration || a.native,
          b.transliteration || b.native
        );
      });
    },
  },
  methods: {
    setLocale(locale) {
      this.$emit('setLocale', locale);
    }
  }  
};
</script>

<style lang="scss" scoped>
.lang-item > .dropdown-item {
  display: flex;
  svg.hide {
    opacity: 0;
  }
  > .title {
    flex: 1;
  }
}
</style>
