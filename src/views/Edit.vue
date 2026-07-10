<template>
  <main class="edit d-flex flex-column">
    <ErrorAlert v-if="error" :url="url" :description="errorDescription" :id="errorId" />
    <Loading v-else-if="loading" stretch />
    <section v-else>
      <div class="header">
        <h2>{{ title }}</h2>
        <div class="actions">
          <b-button variant="primary" :disabled="isSaveDisabled" @click="onSaveRequested">
            {{ $t('manage.save') }}
          </b-button>
        </div>
      </div>

      <ErrorAlert v-if="editorError" dismissible :url="editorUrl" :description="editorError" @close="editorError = null" />
      <b-alert v-else-if="showPermissionWarning" variant="warning" show>{{ $t('errors.missingPermissions') }}</b-alert>

      <JsonEditor
        v-model="jsonContent"
        :read-only="isSaveDisabled"
        @request-save="onSaveRequested"
      />
    </section>
  </main>
</template>

<script>
import { defineComponent } from 'vue';
import { mapGetters, mapState } from 'vuex';
import BrowseMixin from './BrowseMixin.js';
import JsonEditor from '../components/management/JsonEditor.vue';
import { getErrorMessage } from '../store/utils';
import { toAbsolute } from 'stac-js/src/http.js';

export default defineComponent({
  name: "Edit",
  components: {
    JsonEditor
  },
  mixins: [
    BrowseMixin,
  ],
  props: {
    mode: {
      type: String,
      default: 'edit'
    }
  },
  data() {
    return {
      jsonContent: '',
      sourceContent: '',
      saving: false,
      editorError: null
    };
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['collectionLink', 'parentLink', 'toBrowserPath']),
    ...mapGetters('manager', ['canEdit', 'canAddCollections', 'canAddItems', 'isCheckingPermissions']),
    isCreateCollection() {
      return this.mode === 'create-collection';
    },
    isCreateItem() {
      return this.mode === 'create-item';
    },
    createUrl() {
      if (this.isCreateCollection) {
        return this.data?.getApiCollectionsLink()?.getAbsoluteUrl() || null;
      }
      else if (this.isCreateItem) {
        return this.data?.getApiItemsLink()?.getAbsoluteUrl() || null;
      }
      return null;
    },
    editorUrl() {
      if (this.mode === 'edit') {
        return this.url;
      }
      return this.createUrl || this.url;
    },
    isSaveDisabled() {
      if (this.saving) {
        return true;
      }
      if (this.mode === 'create-collection') {
        return !this.canAddCollections || !this.createUrl;
      }
      else if (this.mode === 'create-item') {
        return !this.canAddItems || !this.createUrl;
      }
      return !this.canEdit;
    },
    showPermissionWarning() {
      if (this.saving || this.loading) {
        return false;
      }
      // Don't warn while the permissions are still being checked
      return this.isSaveDisabled && !this.isCheckingPermissions(this.editorUrl);
    },
    title() {
      if (this.mode === 'edit') {
        return this.$t('manage.edit');
      }
      else if (this.mode === 'create-collection') {
        return this.$t('manage.addCollection');
      }
      else if (this.mode === 'create-item') {
        return this.$t('manage.addItem');
      }
      return '';
    }
  },
  watch: {
    data() {
      this.initEditor();
    },
    mode: {
      immediate: true,
      handler(mode, oldMode) {
        if (oldMode) {
          // When switching between management pages of the same entity (e.g. Edit
          // to Add Item), the view and path stay the same so that the path watcher
          // (see BrowseMixin) doesn't trigger a load, but the page state has been
          // reset by the route change. Thus load the entity again here.
          this.browse(this.path);
        }
        this.initEditor();
      }
    }
  },
  methods: {
    initEditor() {
      if (this.mode === 'edit') {
        this.syncFromStore();
      }
      else {
        this.resetTemplate();
      }
    },
    parseJson() {
      let data;
      try {
        data = JSON.parse(this.jsonContent);
      } catch (error) {
        this.editorError = error.message;
        return null;
      }
      if (!data || Array.isArray(data) || typeof data !== 'object') {
        this.editorError = this.$t('errors.invalidJsonObject');
        return null;
      }
      this.editorError = null;
      return data;
    },
    onSaveRequested() {
      const body = this.parseJson();
      if (!body) {
        return;
      }
      this.save(body);
    },
    syncFromStore() {
      if (!this.data || typeof this.data.toJSON !== 'function') {
        return;
      }
      // Prefer the original (pre-migration) document so editing doesn't silently
      // upgrade the resource to the latest STAC version on save.
      const source = this.data._original || this.data.toJSON();
      const content = JSON.stringify(source, null, 2);
      this.sourceContent = content;
      this.jsonContent = content;
      this.editorError = null;
    },
    resetTemplate() {
      const template = this.getTemplate();
      if (!template) {
        return;
      }
      this.jsonContent = JSON.stringify(template, null, 2);
      this.sourceContent = this.jsonContent;
      this.editorError = null;
    },
    getTemplate() {
      if (this.isCreateCollection) {
        const isoDate = new Date().toISOString();
        return {
          type: 'Collection',
          stac_version: this.data?.stac_version || '1.1.0',
          id: '',
          description: '',
          license: 'proprietary',
          extent: {
            spatial: {
              bbox: [[-180, -90, 180, 90]]
            },
            temporal: {
              interval: [[isoDate, isoDate]]
            }
          },
          links: []
        };
      }
      else if (this.isCreateItem) {
        const datetime = new Date().toISOString();
        return {
          type: 'Feature',
          stac_version: this.data?.stac_version || '1.1.0',
          id: '',
          geometry: null,
          bbox: [],
          properties: {
            datetime
          },
          links: [],
          assets: {}
        };
      }
      return null;
    },
    getFallbackNavigationPath() {
      return this.path || '/';
    },
    createLink(method, href, body) {
      return {
        href,
        method,
        type: 'application/json',
        headers: { 'Content-Type': 'application/json' },
        body
      };
    },
    async save(body) {
      this.saving = true;
      this.editorError = null;
      try {
        if (this.mode === 'edit') {
          await this.$store.dispatch('request', {
            link: this.createLink('PUT', this.url, body)
          });
          // Remove the parent from the cache so that its cached list of
          // children reflects the update (e.g. an updated title)
          const parent = this.collectionLink || this.parentLink;
          if (parent) {
            this.$store.commit('clear', parent.getAbsoluteUrl());
          }
          await this.$store.dispatch('load', { url: this.url, show: true, force: true });
        }
        else {
          const response = await this.$store.dispatch('request', {
            link: this.createLink('POST', this.createUrl, body)
          });
          // Remove the parent from the cache so that its cached list of
          // children includes the newly created resource
          this.$store.commit('clear', this.url);
          const location = response?.headers?.location;
          // The Location header may be relative to the request URL
          const targetPath = location ? this.toBrowserPath(toAbsolute(location, this.createUrl)) : this.getFallbackNavigationPath();
          const pathMatch = targetPath.replace(/^\/+/, '');
          await this.$router.push({ name: 'browse', params: { pathMatch } });
        }
      } catch (error) {
        this.editorError = getErrorMessage(error, true);
      } finally {
        this.saving = false;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.edit > section {
  display: flex;
  flex-direction: column;
  gap: var(--sb-block-gap);
  margin-bottom: var(--sb-block-gap);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--sb-block-gap);

  > h2 {
    flex-grow: 1;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
}
</style>
