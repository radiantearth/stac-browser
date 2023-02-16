<template>
  <div class="share mt-1">
    <b-button-group>
      <b-button v-if="stacUrl" size="sm" variant="outline-primary" id="popover-link" :title="$t('source.detailsAboutSource')">
        <b-icon-link /> <span class="button-label">{{ $t('source.label') }}</span>
      </b-button>
      <b-button size="sm" variant="outline-primary" id="popover-share" :title="$t('source.share.withOthers')">
        <b-icon-share /> <span class="button-label">{{ $t('source.share.label') }}</span>
      </b-button>
      <b-dropdown size="sm" variant="outline-primary" right :title="$t('source.language.switch')">
        <template #button-content>
          <b-icon-flag /> <span class="button-label">{{ $t('source.language.label', {currentLanguage}) }}</span>
        </template>
        <b-dropdown-item
          v-for="l of languages" :key="l.code" class="lang-item"
          @click="switchLocale({locale: l.code, userSelected: true})"
        >
          <b-icon-check v-if="locale === l.code" />
          <b-icon-blank v-else />
          <span class="title">
            {{ l.native }}
            <template v-if="l.global && l.global !== l.native"> / {{ l.global }}</template>
          </span>
          <b-icon-exclamation-triangle v-if="supportsLanguageExt && (!l.ui || !l.data)" :title="l.ui ? $t('source.language.onlyUI') : $t('source.language.onlyData')" class="ml-2" />
        </b-dropdown-item>
      </b-dropdown>
    </b-button-group>
    <b-popover
      v-if="stacUrl" target="popover-link" triggers="focus" placement="bottom"
      container="stac-browser" :title="$t('source.title')"
      @show="validate"
    >
      <template v-if="stacVersion">
        <b-row>
          <b-col cols="2">{{ $t('source.stacVersion') }}</b-col>
          <b-col>{{ stacVersion }}</b-col>
        </b-row>
        <b-row v-if="canValidate">
          <b-col cols="2">{{ $t('source.valid') }}</b-col>
          <b-col>
            <b-spinner v-if="valid === null" :label="$t('source.validating')" small />
            <template v-else-if="valid === true">✔️</template>
            <template v-else-if="valid === false">❌</template>
            <template v-else>$t('source.validationNA')</template>
          </b-col>
        </b-row>
        <hr>
      </template>
      <Url id="stacUrl" :url="stacUrl" :label="$t('source.locatedAt')" />
    </b-popover>
    <b-popover target="popover-share" triggers="focus" placement="bottom" container="stac-browser" :title="$t('source.share.title')">
      <Url id="browserUrl" :url="browserUrl()" :label="$t('source.share.sharePageWithOthers')" :open="false" />
      <hr>
      <b-button class="twitter mr-1" :href="twitterUrl"><b-icon-twitter /> {{ $t('source.share.twitter') }}</b-button>
      <b-button variant="dark" :href="mailTo"><b-icon-envelope /> {{ $t('source.share.email') }}</b-button>
    </b-popover>
  </div>
</template>

<script>
import { 
  BIconBlank, BIconCheck, BIconEnvelope, BIconExclamationTriangle, BIconFlag, BIconLink, BIconShare, BIconTwitter,
  BDropdown, BDropdownItem, BPopover } from 'bootstrap-vue';
import { mapActions, mapGetters, mapState } from 'vuex';

import Url from './Url.vue';

import URI from 'urijs';
import Utils from '../utils';
import { getBest, prepareSupported } from '../locale-id';

const LANGUAGE_EXT = 'https://stac-extensions.github.io/language/v1.*/schema.json';

export default {
    name: "Source",
    components: {
        BDropdown,
        BDropdownItem,
        BIconBlank,
        BIconCheck,
        BIconEnvelope,
        BIconExclamationTriangle,
        BIconFlag,
        BIconLink,
        BIconShare,
        BIconTwitter,
        BPopover,
        Url
    },
    props: {
        title: {
            type: String,
            required: true
        },
        stacUrl: {
            type: String,
            default: null
        },
        stacVersion: {
            type: String,
            default: null
        }
    },
    computed: {
        ...mapState(['dataLanguages', 'locale', 'privateQueryParameters', 'supportedLocales', 'stacLint', 'stacProxyUrl', 'uiLanguage', 'valid']),
        ...mapGetters(['supportsExtension']),
        currentLanguage() {
          let lang = this.languages.find(l => l.code === this.locale);
          if (lang) {
            return lang.native;
          }
          else {
            return '-';
          }
        },
        canValidate() {
            if (!this.stacLint || typeof this.stacUrl !== 'string') {
                return false;
            }
            else if (Utils.size(this.privateQueryParameters) > 0) {
                // Don't expose private query parameters to externals
                return false;
            }
            else if (Array.isArray(this.stacProxyUrl)) {
                // Don't validate if a proxy has been set
                return false;
            }
            let uri = new URI(this.stacUrl);
            let host = uri.hostname().toLowerCase();
            if (host === 'localhost' || host.startsWith('127.') || host === '::1') {
                // Can't validate localhost
                return false;
            }
            return true;
        },
        message() {
            return this.$t('source.share.message', {title: this.title, url: this.browserUrl()});
        },
        twitterUrl() {
            let text = encodeURIComponent(this.message);
            return `https://twitter.com/intent/tweet?text=${text}`;
        },
        mailTo() {
            let title = encodeURIComponent(this.title);
            let text = encodeURIComponent(this.message);
            return `mailto:?subject=${title}&body=${text}`;
        },
        supportsLanguageExt() {
          return this.supportsExtension(LANGUAGE_EXT);
        },
        languages() {
          let languages = [];

          // Add all UI languages
          for(let code of this.supportedLocales) {
            languages.push({
              code,
              native: this.$t(`languages.${code}.native`),
              global: this.$t(`languages.${code}.global`),
              ui: true
            });
          }

          // Add missing data languages
          for(let lang of this.dataLanguages) {
            if (!Utils.isObject(lang) || !lang.code || this.supportedLocales.includes(lang.code)) {
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

          if (this.supportsExtension(LANGUAGE_EXT)) {
            // Determine which languages are complete
            const uiSupported = prepareSupported(this.supportedLocales);
            const dataSupported = prepareSupported(this.dataLanguages.map(l => l.code));
            for(let l of languages) {
              if (!l.ui) {
                l.ui = Boolean(getBest(uiSupported, l.code, null));
              }
              if (!l.data) {
                l.data = Boolean(getBest(dataSupported, l.code, null));
              }
            }
          }
          
          return languages.sort((a,b) => a.global.localeCompare(b.global, this.uiLanguage));
        }
    },
    methods: {
        ...mapActions(['switchLocale']),
        async validate() {
            await this.$store.dispatch('validate', this.stacUrl);
        },
        browserUrl() {
          return window.location.toString();
        }
    }
};
</script>

<style lang="scss" scoped>
.popover {
    width: 100%;
    max-width: 800px;
}
.lang-item > .dropdown-item {
  display: flex;
  > .title {
    flex: 1;
  }
}
</style>