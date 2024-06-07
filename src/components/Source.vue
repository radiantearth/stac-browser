<template>
  <div class="share mt-1">
    <b-button-group>
      <b-button v-if="showRoot" size="sm" variant="outline-primary" id="popover-root-btn">
        <b-icon-box /> <span class="button-label">{{ rootTitle }}</span>
      </b-button>
      <b-button v-if="stacUrl" size="sm" variant="outline-primary" id="popover-link-btn" :title="$t('source.detailsAboutSource')">
        <b-icon-link /> <span class="button-label">{{ $t('source.label') }}</span>
      </b-button>
      <b-button size="sm" variant="outline-primary" id="popover-share-btn" :title="$t('source.share.withOthers')">
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
            <span :lang="l.code">{{ l.native }}</span>
            <template v-if="l.global && l.global !== l.native"> / <span lang="en">{{ l.global }}</span></template>
          </span>
          <b-icon-exclamation-triangle v-if="supportsLanguageExt && (!l.ui || !l.data)" :title="l.ui ? $t('source.language.onlyUI') : $t('source.language.onlyData')" class="ml-2" />
        </b-dropdown-item>
      </b-dropdown>
    </b-button-group>

    <b-popover
      v-if="showRoot" id="popover-root" target="popover-root-btn" triggers="focus"
      placement="bottom" container="stac-browser" :title="rootTitle"
    >
      <RootStats />
    </b-popover>

    <b-popover
      v-if="stacUrl" id="popover-link" target="popover-link-btn" triggers="focus"
      placement="bottom" container="stac-browser" :title="$t('source.title')"
    >
      <template v-if="stac">
        <b-row v-if="stacId" class="stac-id">
          <b-col cols="4">{{ $t('source.id') }}</b-col>
          <b-col>
            <code>{{ stacId }}</code>
            <CopyButton :copyText="stacId" :button-props="{size: 'sm'}" variant="primary" class="ml-2" />
          </b-col>
        </b-row>
        <b-row v-if="stacVersion" class="stac-version">
          <b-col cols="4">{{ $t('source.stacVersion') }}</b-col>
          <b-col>{{ stacVersion }}</b-col>
        </b-row>
        <b-row class="stac-valid">
          <b-col cols="4">{{ $t('source.valid') }}</b-col>
          <b-col>
            <Validation :data="stac" />
          </b-col>
        </b-row>
        <hr>
      </template>
      <Url id="stacUrl" :url="stacUrl" :label="$t('source.locatedAt')" />
    </b-popover>

    <b-popover id="popover-share" target="popover-share-btn" triggers="focus" placement="bottom" container="stac-browser" :title="$t('source.share.title')">
      <Url id="browserUrl" :url="browserUrl()" :label="$t('source.share.sharePageWithOthers')" :open="false" />
      <hr>
      <b-button class="twitter mr-1" :href="twitterUrl"><b-icon-twitter /> {{ $t('source.share.twitter') }}</b-button>
      <b-button variant="dark" :href="mailTo"><b-icon-envelope /> {{ $t('source.share.email') }}</b-button>
    </b-popover>
  </div>
</template>

<script>
import { 
  BIconBlank, BIconBox, BIconCheck, BIconEnvelope, BIconExclamationTriangle, BIconFlag, BIconLink, BIconShare, BIconTwitter,
  BDropdown, BDropdownItem, BPopover } from 'bootstrap-vue';
import { mapActions, mapGetters, mapState } from 'vuex';

import Url from './Url.vue';

import Utils from '../utils';
import { getBest, prepareSupported } from '../locale-id';
import CopyButton from './CopyButton.vue';

const LANGUAGE_EXT = 'https://stac-extensions.github.io/language/v1.*/schema.json';

export default {
  name: "Source",
  components: {
    BDropdown,
    BDropdownItem,
    BIconBlank,
    BIconBox,
    BIconCheck,
    BIconEnvelope,
    BIconExclamationTriangle,
    BIconFlag,
    BIconLink,
    BIconShare,
    BIconTwitter,
    BPopover,
    RootStats: () => import('./RootStats.vue'),
    Url,
    CopyButton,
    Validation: () => import('./Validation.vue')
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
    stac: {
      type: Object,
      default: null
    }
  },
  computed: {
    ...mapState(['conformsTo', 'dataLanguages', 'locale', 'supportedLocales', 'uiLanguage', 'valid']),
    ...mapGetters(['supportsExtension', 'root']),
    stacVersion() {
      return this.stac?.stac_version;
    },
    stacId() {
      return this.stac?.id;
    },
    showRoot() {
      if (!this.root) {
        return false;
      }
      return (Array.isArray(this.conformsTo) && this.conformsTo.length > 0)
        || Utils.isObject(this.root['stats:collections'])
        || Utils.isObject(this.root['stats:catalogs'])
        || Utils.isObject(this.root['stats:items']);
    },
    rootTitle() {
      return Array.isArray(this.conformsTo) && this.conformsTo.length > 0 ? this.$t('index.api') : this.$t('index.catalog');
    },
    currentLanguage() {
      let lang = this.languages.find(l => l.code === this.locale);
      if (lang) {
        return lang.native;
      }
      else {
        return '-';
      }
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
      
      const collator = new Intl.Collator(this.uiLanguage);
      return languages.sort((a,b) => collator.compare(a.global, b.global));
    }
  },
  methods: {
    ...mapActions(['switchLocale']),
    browserUrl() {
      return window.location.toString();
    }
  }
};
</script>

<style lang="scss">
#popover-link, #popover-root, #popover-share {
  width: 80%;
  max-width: 800px;

  .popover-body {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: 80vh;
  }
}

#popover-link .stac-id .btn-sm,
#popover-link .stac-valid .btn-sm {
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
    font-size: 0.7rem;
}

</style>
<style lang="scss" scoped>
.lang-item > .dropdown-item {
  display: flex;
  > .title {
    flex: 1;
  }
}
</style>
