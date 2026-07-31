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

      <b-alert v-if="draftRestored" variant="info" show dismissible @close="draftRestored = false">
        {{ $t('manage.draftRestored') }}
        <b-button size="sm" variant="primary" class="ms-2" @click="discardDraft">{{ $t('manage.discardDraft') }}</b-button>
      </b-alert>

      <JsonEditor
        v-model="jsonContent"
        :read-only="isSaveDisabled"
        @request-save="onSaveRequested"
      />

      <b-modal :title="$t('manage.unsavedChangesTitle')" v-model="showLeaveConfirm" @hide="resolveLeave(false)">
        <p>{{ $t('manage.unsavedChangesLeave') }}</p>
        <template #footer>
          <b-button variant="danger" @click="resolveLeave(true)">
            {{ $t('manage.leavePage') }}
          </b-button>
          <b-button variant="secondary" @click="resolveLeave(false)">
            {{ $t('cancel') }}
          </b-button>
        </template>
      </b-modal>
    </section>
  </main>
</template>

<script>
import { defineAsyncComponent, defineComponent, markRaw } from 'vue';
import { mapGetters, mapState } from 'vuex';
import BrowseMixin from './BrowseMixin.js';
import JsonEditor from '../components/management/JsonEditor.vue';
import BrowserStorage from '../browser-store';
import { getErrorMessage } from '../store/utils';
import { toAbsolute } from 'stac-js/src/http.js';
import { isObject } from 'stac-js/src/utils.js';

const DRAFT_SAVE_DELAY = 1000;
const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000; // discard drafts after a week

export default defineComponent({
  name: "Edit",
  components: {
    BModal: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BModal)),
    JsonEditor
  },
  mixins: [
    BrowseMixin,
  ],
  // Ask for confirmation when leaving the page with unsaved changes.
  // Mode switches between management routes of the same entity also pass
  // through here as the routes are separate route records.
  beforeRouteLeave() {
    return this.confirmLeave();
  },
  beforeRouteUpdate() {
    return this.confirmLeave();
  },
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
      editorError: null,
      draftRestored: false,
      draftTimer: null,
      showLeaveConfirm: false,
      leaveResolver: null,
      // The storage has internal state and is not rendered, keep it out of the reactivity system
      storage: markRaw(new BrowserStorage())
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
    },
    isDirty() {
      return this.sourceContent.length > 0 && this.jsonContent !== this.sourceContent;
    },
    draftKey() {
      return `draft:${this.mode}:${this.path || '/'}`;
    }
  },
  watch: {
    data() {
      this.initEditor();
    },
    jsonContent() {
      this.scheduleDraftSave();
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
  mounted() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    this.flushDraft();
  },
  methods: {
    initEditor() {
      if (this.mode === 'edit') {
        this.syncFromStore();
      }
      else {
        this.resetTemplate();
      }
      this.restoreDraft();
    },
    scheduleDraftSave() {
      clearTimeout(this.draftTimer);
      this.draftTimer = setTimeout(() => this.flushDraft(), DRAFT_SAVE_DELAY);
    },
    // Persist the draft so that the edits survive events that destroy the
    // component state, e.g. the full-page redirect of an OIDC login.
    flushDraft() {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
      if (!this.sourceContent) {
        return; // The editor has not been initialized yet
      }
      if (this.isDirty) {
        this.storage.set(this.draftKey, { content: this.jsonContent, saved: Date.now() });
      }
      else {
        this.storage.remove(this.draftKey);
      }
    },
    removeDraft() {
      clearTimeout(this.draftTimer);
      this.draftTimer = null;
      this.storage.remove(this.draftKey);
    },
    restoreDraft() {
      if (!this.sourceContent) {
        return;
      }
      const draft = this.storage.get(this.draftKey);
      if (!draft) {
        return;
      }
      if (
        !isObject(draft) || typeof draft.content !== 'string'
        || draft.content === this.sourceContent
        || !(Date.now() - draft.saved <= DRAFT_TTL)
      ) {
        this.removeDraft();
        return;
      }
      this.jsonContent = draft.content;
      this.draftRestored = true;
    },
    discardDraft() {
      this.jsonContent = this.sourceContent;
      this.removeDraft();
      this.draftRestored = false;
    },
    confirmLeave() {
      this.flushDraft();
      if (!this.isDirty || this.saving || this.$store.state.auth.inProgress) {
        return true;
      }
      this.showLeaveConfirm = true;
      // The navigation waits for the promise, which the modal buttons resolve
      return new Promise(resolve => {
        this.leaveResolver = resolve;
      });
    },
    resolveLeave(leave) {
      this.showLeaveConfirm = false;
      if (this.leaveResolver) {
        this.leaveResolver(leave);
        this.leaveResolver = null;
      }
    },
    onBeforeUnload(event) {
      this.flushDraft();
      // Don't block the page unload for an ongoing login (e.g. OIDC redirects
      // to the identity provider) - the draft preserves the changes instead.
      if (this.isDirty && !this.saving && !this.$store.state.auth.inProgress) {
        event.preventDefault();
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
    // The changes reached the server: the draft is obsolete and the editor
    // content is the new baseline (so that the leave guards stay quiet).
    onSaved() {
      this.sourceContent = this.jsonContent;
      this.removeDraft();
      this.draftRestored = false;
    },
    async save(body) {
      this.saving = true;
      this.editorError = null;
      try {
        if (this.mode === 'edit') {
          await this.$store.dispatch('request', {
            link: this.createLink('PUT', this.url, body)
          });
          this.onSaved();
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
          this.onSaved();
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
