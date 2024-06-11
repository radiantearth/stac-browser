<template>
  <b-row>
    <b-col md="12">
      <Source class="float-right" :title="title" :stacUrl="url" :stac="data" />
      <h1>
        <template v-if="icon">
          <img :src="icon.href" :alt="icon.title" :title="icon.title" class="icon mr-2">
        </template>
        <span class="title">{{ title }}</span>
      </h1>
      <p class="lead" v-if="!isStacChooser()">
        <i18n v-if="containerLink" tag="span" path="in" class="in mr-3">
          <template #catalog><StacLink :data="containerLink" /></template>
        </i18n>
        <b-button-group>
          <b-button v-if="back" :to="selfBrowserLink" :title="$t('goBack.description', {type})" variant="outline-primary" size="sm">
            <b-icon-arrow-left /> <span class="button-label prio">{{ $t('goBack.label') }}</span>
          </b-button>
          <b-button v-if="parentLink" :to="toBrowserPath(parentLink.href)" :title="parentLinkTitle" variant="outline-primary" size="sm">
            <b-icon-arrow-90deg-up /> <span class="button-label prio">{{ $t('goToParent.label') }}</span>
          </b-button>
          <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink.href)" :title="collectionLinkTitle" variant="outline-primary" size="sm">
            <b-icon-folder-symlink /> <span class="button-label prio">{{ $t('goToCollection.label') }}</span>
          </b-button>
          <b-button variant="outline-primary" size="sm" :title="$t('browse')" v-b-toggle.sidebar @click="$emit('enableSidebar')">
            <b-icon-book /> <span class="button-label prio">{{ $t('browse') }}</span>
          </b-button>
          <b-button v-if="canSearch" variant="outline-primary" size="sm" :to="searchBrowserLink" :title="$t('search.title')" :pressed="isSearchPage()">
            <b-icon-search /> <span class="button-label prio">{{ $t('search.title') }}</span>
          </b-button>
          <b-button v-if="canAuthenticate" variant="outline-primary" size="sm" @click="logInOut" :title="authTitle">
            <component :is="authIcon" /> <span class="button-label">{{ authLabel }}</span>
          </b-button>
        </b-button-group>
      </p>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import Source from './Source.vue';
import StacLink from './StacLink.vue';
import { BIconArrow90degUp, BIconArrowLeft, BIconBook, BIconFolderSymlink, BIconSearch, BIconLock, BIconUnlock } from "bootstrap-vue";
import STAC from '../models/stac';
import Utils from '../utils';

export default {
  name: 'StacHeader',
  components: {
    BIconArrow90degUp,
    BIconArrowLeft,
    BIconBook,
    BIconFolderSymlink,
    BIconSearch,
    BIconLock,
    BIconUnlock,
    StacLink,
    Source
  },
  computed: {
    ...mapState(['allowSelectCatalog', 'catalogUrl', 'data', 'url', 'title']),
    ...mapGetters(['canSearch', 'root', 'parentLink', 'collectionLink', 'toBrowserPath']),
    ...mapGetters('auth', { authMethod: 'method' }),
    ...mapGetters('auth', ['canAuthenticate', 'isLoggedIn']),
    authIcon() {
      return this.isLoggedIn ? 'b-icon-unlock' : 'b-icon-lock';
    },
    authTitle() {
      return this.authMethod.getButtonTitle();
    },
    authLabel() {
      return this.isLoggedIn ? this.authMethod.getLogoutLabel() : this.authMethod.getLoginLabel();
    },
    back() {
      return this.$route.name === 'validation';
    },
    selfBrowserLink() {
      return this.toBrowserPath(this.url);
    },
    type() {
      if (this.data instanceof STAC) {
        if (this.data.isItem()) {
          return this.$tc('stacItem');
        }
        else if (this.data.isCollection()) {
          return this.$tc(`stacCollection`);
        }
        else if (this.data.isCatalog()) {
          return this.$tc(`stacCatalog`);
        }
        else {
          return this.data.type;
        }
      }
      return null;
    },
    collectionLinkTitle() {
      if (this.collectionLink && Utils.hasText(this.collectionLink.title)) {
        return this.$t('goToCollection.descriptionWithTitle', this.collectionLink);
      }
      else {
        return this.$t('goToCollection.description');
      }
    },
    parentLinkTitle() {
      if (this.parentLink && Utils.hasText(this.parentLink.title)) {
        return this.$t('goToParent.descriptionWithTitle', this.parentLink);
      }
      else {
        return this.$t('goToParent.description');
      }
    },
    icon() {
      if (this.data instanceof STAC) {
        let icons = this.data.getIcons();
        if (icons.length > 0) {
          return icons[0];
        }
      }
      return null;
    },
    searchBrowserLink() {
      if (!this.canSearch) {
        return null;
      }
      let dataLink;
      if (this.data instanceof STAC && !this.data.equals(this.root)) {
        dataLink = this.data.getSearchLink();
      }
      if (dataLink) {
        return `/search${this.data.getBrowserPath()}`;
      }
      else if (this.root && this.allowSelectCatalog) {
        return `/search${this.root.getBrowserPath()}`;
      }
      return '/search';
    },
    containerLink() {
      // Check two cases where this page is the root...
      if (this.catalogUrl && this.url === this.catalogUrl) {
        return null;
      }
      if (this.root) {
        if (Utils.equalUrl(this.root.getAbsoluteUrl(), this.url)) {
          return null;
        }
        else {
          return {
            href: this.root.getAbsoluteUrl(),
            rel: 'root',
            title: STAC.getDisplayTitle(this.root)
          };
        }
      }
      return this.collectionLink || this.parentLink;
    }
  },
  methods: {
    ...mapMutations('auth', ['addAction']),
    ...mapActions('auth', ['requestLogin', 'requestLogout']),
    isSearchPage() {
      return this.$router.currentRoute.name === 'search';
    },
    isStacChooser() {
      return this.$router.currentRoute.name === 'choose';
    },
    async logInOut() {
      if (this.url) {
        this.addAction(() => this.$store.dispatch("load", {
          url: this.url,
          loadApi: true,
          show: true,
          force: true,
          noRetry: true
        }));
      }
      if (this.isLoggedIn) {
        await this.requestLogout();
      }
      else {
        await this.requestLogin();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
h1 {
  word-break: break-word;
}
</style>
