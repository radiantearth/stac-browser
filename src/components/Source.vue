<template>
  <nav class="share">
    <b-button-group>
      <b-button
        v-if="stacUrl" size="sm" variant="outline-primary" id="popover-link-btn"
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
      v-if="stacUrl" id="popover-link" custom-class="popover-large" target="popover-link-btn"
      triggers="focus" placement="bottom" container="stac-browser" :title="$t('source.title')"
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

    <b-popover
      id="popover-share" custom-class="popover-large" target="popover-share-btn" triggers="focus"
      placement="bottom" container="stac-browser" :title="$t('source.share.title')"
    >
      <Url id="browserUrl" :url="browserUrl()" :label="$t('source.share.sharePageWithOthers')" :open="false" />
      <template v-if="enableSocialSharing">
        <hr>
        <SocialSharing :text="sharingMessage" :title="title" :url="browserUrl()" />
      </template>
    </b-popover>
  </nav>
</template>

<script>
import { BIconInfoLg, BIconShare, BPopover } from 'bootstrap-vue';
import { mapState } from 'vuex';

import Url from './Url.vue';

import CopyButton from './CopyButton.vue';
import SocialSharing from './SocialSharing.vue';

export default {
  name: "Source",
  components: {
    BIconInfoLg,
    BIconShare,
    BPopover,
    Url,
    CopyButton,
    SocialSharing,
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
    ...mapState(['socialSharing', 'valid']),
    stacVersion() {
      return this.stac?.stac_version;
    },
    stacId() {
      return this.stac?.id;
    },
    enableSocialSharing() {
      return Array.isArray(this.socialSharing) && this.socialSharing.length > 0;
    },
    sharingMessage() {
      const url = window.location.toString();
      return this.$t('source.share.message', {title: this.title, url: url});
    }
  },
  methods: {
    browserUrl() {
      return window.location.toString();
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
