<template>
  <nav class="share">
    <b-button-group>
      <b-dropdown
        v-if="canManage" size="sm" variant="outline-primary" tabindex="0"
      >
        <template #button-content>
          <b-icon-gear-fill /><span class="button-label">{{ $t('source.manage') }}</span>
        </template>
        <b-dropdown-item v-if="canAddCollections" :to="browserPaths.addCollection">
          <b-icon-folder-plus /> {{ $t('manage.addCollection') }}
        </b-dropdown-item>
        <b-dropdown-item v-if="canAddItems" :to="browserPaths.addItem">
          <b-icon-file-plus /> {{ $t('manage.addItem') }}
        </b-dropdown-item>
        <b-dropdown-item v-if="canEdit" :to="browserPaths.edit">
          <b-icon-pencil /> {{ $t('manage.edit') }}
        </b-dropdown-item>
        <b-dropdown-item v-if="canDelete" @click="confirmDelete = true">
          <b-icon-trash /> {{ $t('manage.delete') }}
        </b-dropdown-item>
      </b-dropdown>
      <b-button
        v-if="url" size="sm" variant="outline-primary" id="popover-link-btn"
        :title="$t('source.detailsAboutSource')" tag="a" tabindex="0"
      >
        <b-icon-info-lg /><span class="button-label">{{ $t('source.label') }}</span>
      </b-button>
      <b-button
        size="sm" variant="outline-primary" id="popover-share-btn"
        :title="$t('source.share.withOthers')" tag="a" tabindex="0"
      >
        <b-icon-share /><span class="button-label">{{ $t('source.share.title') }}</span>
      </b-button>
    </b-button-group>
    <b-popover
      v-if="url" id="popover-link" class="popover-large" target="popover-link-btn"
      placement="bottom" :title="$t('source.title')" teleport-to="#stac-browser" strategy="fixed"
      click focus :boundary-padding="10"
      v-model="popoverLinkVisible"
    >
      <template #default v-if="data">
        <b-row v-if="stacId" class="stac-id">
          <b-col cols="4">{{ $t('source.id') }}</b-col>
          <b-col>
            <code>{{ stacId }}</code>
            <CopyButton :copyText="stacId" size="sm" variant="primary" class="ms-2" />
          </b-col>
        </b-row>
        <b-row v-if="stacVersion" class="stac-version">
          <b-col cols="4">{{ $t('source.stacVersion') }}</b-col>
          <b-col>{{ stacVersion }}</b-col>
        </b-row>
        <b-row class="stac-valid">
          <b-col cols="4">{{ $t('source.valid') }}</b-col>
          <b-col>
            <Validation v-if="popoverLinkVisible !== null" :data="data" />
          </b-col>
        </b-row>
        <hr>
        <Url id="url" :url="url" :label="$t('source.locatedAt')" />
      </template>
    </b-popover>
    <b-popover
      id="popover-share" class="popover-large" target="popover-share-btn"
      placement="bottom" :title="$t('source.share.title')" teleport-to="#stac-browser" strategy="fixed"
      click focus :boundary-padding="10"
    >
      <Url id="browserUrl" :url="browserUrl()" :label="$t('source.share.sharePageWithOthers')" :open="false" />
      <template v-if="enableSocialSharing">
        <hr>
        <SocialSharing :text="sharingMessage" :title="title" :url="browserUrl()" />
      </template>
    </b-popover>
    <b-modal :title="$t('manage.confirmDeleteTitle')" v-model="confirmDelete">
      <p>{{ $t('manage.confirmDeleteMessage') }}</p>
      <p>{{ $t('manage.noUndo') }}</p>
      <template #footer="{ close }">
        <b-button variant="danger" @click="deleteThis">
          <b-spinner v-if="deleting" small />
          {{ $t('manage.delete') }}
        </b-button>
        <b-button variant="secondary" @click="close()">
          {{ $t('cancel') }}
        </b-button>
      </template>
    </b-modal>
  </nav>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { defineAsyncComponent } from 'vue';
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next';

import Url from './Url.vue';
import CopyButton from './CopyButton.vue';
import SocialSharing from './SocialSharing.vue';
import { getErrorMessage } from '../store/utils.js';

export default {
  name: "StacSource",
  components: {
    BDropdown,
    BDropdownItem,
    Url,
    CopyButton,
    SocialSharing,
    BModal: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BModal)),
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover)),
    Validation: defineAsyncComponent(() => import('./Validation.vue'))
  },
  props: {
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      popoverLinkVisible: null, // null = not yet opened, true = open, false = closed
      deleting: false,
      confirmDelete: false
    };
  },
  computed: {
    ...mapState(['data', 'socialSharing', 'url']),
    ...mapGetters(['toBrowserPath', 'collectionLink', 'parentLink', 'rootLink']),
    ...mapGetters('manager', ['browserPaths', 'canEdit', 'canDelete', 'canManage', 'canAddCollections', 'canAddItems']),
    stacVersion() {
      return this.data?.stac_version;
    },
    stacId() {
      return this.data?.id;
    },
    enableSocialSharing() {
      return Array.isArray(this.socialSharing) && this.socialSharing.length > 0;
    },
    sharingMessage() {
      const url = window.location.toString();
      return this.$t('source.share.message', {title: this.title, url: url});
    },
  },
  methods: {
    browserUrl() {
      return window.location.toString();
    },
    async deleteThis() {
      this.deleting = true;
      const link = {
        href: this.url,
        method: 'DELETE'
      };
      try {
        await this.$store.dispatch('request', { link });
        const redirect = this.collectionLink || this.parentLink || this.rootLink;
        const path = this.toBrowserPath(redirect?.getAbsoluteUrl() || '/');
        this.$router.push(path);
      } catch (error) {
        const message = getErrorMessage(error, true);
        this.$store.commit('showGlobalError', { error, message });
      } finally {
        this.deleting = false;
        this.confirmDelete = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.share {
  display: flex;
  gap: 0.25rem;
}
</style>

<style lang="scss">
#popover-link .stac-id .btn-sm,
#popover-link .stac-valid .btn-sm {
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
    font-size: 0.7rem;
}
</style>
