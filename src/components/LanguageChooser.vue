<template>
  <b-dropdown size="sm" variant="primary" right :title="$t('source.language.switch')">
    <template #button-content>
      <b-icon-flag /><span class="button-label">{{ $t('source.language.label', {currentLanguage}) }}</span>
    </template>
    <b-dropdown-item v-for="l of languages" :key="l.code" class="lang-item" @click="setLocale(l.code)">
      <b-icon-check v-if="currentLocale === l.code" />
      <b-icon-blank v-else />
      <span class="title">
        <span :lang="l.code">{{ l.native }}</span>
        <template v-if="l.global && l.global !== l.native"> / <span lang="en">{{ l.global }}</span></template>
      </span>
      <b-icon-exclamation-triangle v-if="supportsLanguageExt && (!l.ui || !l.data)" :title="l.ui ? $t('source.language.onlyUI') : $t('source.language.onlyData')" class="ml-2" />
    </b-dropdown-item>
  </b-dropdown>
</template>

<script>
import {
  BDropdown, BDropdownItem, 
  BIconBlank, BIconCheck, BIconExclamationTriangle, BIconFlag } from "bootstrap-vue";

import { STAC } from 'stac-js';
import { getBest, prepareSupported } from 'stac-js/src/locales';

import { getDataLanguages, STAC_LANGUAGE_EXT } from '../i18n';
import Utils from '../utils';

export default {
  name: 'LanguageChooser',
  components:  {
    BDropdown,
    BDropdownItem,
    BIconBlank,
    BIconCheck,
    BIconExclamationTriangle,
    BIconFlag,
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
      return this.data instanceof STAC && this.data.supportsExtension(STAC_LANGUAGE_EXT);
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
  > .title {
    flex: 1;
  }
}
</style>
