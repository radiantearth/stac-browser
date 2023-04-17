<template>
  <b-row>
    <b-col md="12">
      <Source class="float-right" :title="title" :stacUrl="url" :stacVersion="stacVersion" />
      <h1>
        <template v-if="icon">
          <img :src="icon.href" :alt="icon.title" :title="icon.title" class="icon mr-2">
        </template>
        <span class="title">{{ title }}</span>
      </h1>
      <p class="lead" v-if="url || isSearchPage()">
        <i18n v-if="containerLink" tag="span" path="in" class="in mr-3">
          <template #catalog><StacLink :data="containerLink" /></template>
        </i18n>
        <b-button-group>
          <b-button v-if="parentLink" :to="toBrowserPath(parentLink.href)" :title="parentLinkTitle" variant="outline-primary" size="sm">
            <b-icon-arrow-90deg-up /> <span class="button-label prio">{{ $t('goToParent.label') }}</span>
          </b-button>
          <b-button v-if="collectionLink" :to="toBrowserPath(collectionLink.href)" :title="collectionLinkTitle" variant="outline-primary" size="sm">
            <b-icon-folder-symlink /> <span class="button-label prio">{{ $t('goToCollection.label') }}</span>
          </b-button>
          <b-button variant="outline-primary" size="sm" :title="$t('browse')" v-b-toggle.sidebar @click="$emit('enableSidebar')">
            <b-icon-book /> <span class="button-label prio">{{ $t('browse') }}</span>
          </b-button>
          <b-button v-if="searchBrowserLink" variant="outline-primary" size="sm" :to="searchBrowserLink" :title="$t('search.title')" :pressed="isSearchPage()">
            <b-icon-search /> <span class="button-label prio">{{ $t('search.title') }}</span>
          </b-button>
          <b-button v-if="canAuthenticate" variant="outline-primary" size="sm" @click="openAuthentication" :title="authMethod.getButtonTitle()">
            <template v-if="isLoggedIn">
              <b-icon-lock /> <span class="button-label">{{ authMethod.getAuthorizedLabel() }}</span>
            </template>
            <template v-else>
              <b-icon-unlock /> <span class="button-label">{{ authMethod.getUnauthorizedLabel() }}</span>
            </template>
          </b-button>
        </b-button-group>
      </p>
    </b-col>
  </b-row>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex';
import StacLink from './StacLink.vue';
import { BIconArrow90degUp, BIconBook, BIconFolderSymlink, BIconSearch, BIconLock, BIconUnlock } from "bootstrap-vue";
import Source from './Source.vue';
import STAC from '../models/stac';
import Utils from '../utils';

export default {
  name: 'StacHeader',
  components: {
    BIconArrow90degUp,
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
    ...mapGetters(['root', 'parentLink', 'collectionLink', 'toBrowserPath']),
    ...mapGetters('auth', { authMethod: 'method' }),
    ...mapGetters('auth', ['canAuthenticate', 'isLoggedIn']),
    stacVersion() {
      return this.data?.stac_version;
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
      let rootLink;
      let dataLink;
      if (this.root) {
        rootLink = this.root.getSearchLink();
      }
      if (this.data !== this.root && this.data instanceof STAC) {
        dataLink = this.data.getSearchLink();
      }
      if (dataLink) {
        return `/search${this.data.getBrowserPath()}`;
      }
      else if (rootLink) {
        if (!this.allowSelectCatalog) {
          return '/search';
        }
        else {
          return `/search${this.root.getBrowserPath()}`;
        }
      }
      return null;
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
    ...mapActions('auth', ['authenticate']),
    isSearchPage() {
      return this.$router.currentRoute.name === 'search';
    },
    async openAuthentication() {
      this.addAction(() => this.$store.dispatch("load", {
        url: this.url,
        loadApi: true,
        show: true,
        force: true
      }));
      await this.authenticate();
    }
  }
};
</script>

<style lang="scss" scoped>
h1 {
  word-break: break-word;
}
</style>