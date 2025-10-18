<template>
  <nav class="share">
    <b-button-group>
      <TeleportPopover
        v-if="stacUrl"
        :title="$t('source.title')"
        placement="bottom"
        custom-class="popover-large"
      >
        <template #trigger>
          <b-button
            size="sm" variant="outline-primary"
            :title="$t('source.detailsAboutSource')" tag="a" tabindex="0"
          >
            <b-icon-info-lg /><span class="button-label">{{ $t('source.label') }}</span>
          </b-button>
        </template>
        <template #content>
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
        </template>
      </TeleportPopover>

      <TeleportPopover
        :title="$t('source.share.title')"
        placement="bottom"
        custom-class="popover-large"
      >
        <template #trigger>
          <b-button
            size="sm" variant="outline-primary"
            :title="$t('source.share.withOthers')" tag="a" tabindex="0"
          >
            <b-icon-share /><span class="button-label">{{ $t('source.share.title') }}</span>
          </b-button>
        </template>
        <template #content>
          <Url id="browserUrl" :url="browserUrl()" :label="$t('source.share.sharePageWithOthers')" :open="false" />
          <template v-if="enableSocialSharing">
            <hr>
            <SocialSharing :text="sharingMessage" :title="title" :url="browserUrl()" />
          </template>
        </template>
      </TeleportPopover>
    </b-button-group>
  </nav>
</template>

<script>
import { mapState } from 'vuex';
import { defineAsyncComponent } from 'vue';

import Url from './Url.vue';
import TeleportPopover from './TeleportPopover.vue';
import CopyButton from './CopyButton.vue';
import SocialSharing from './SocialSharing.vue';

export default {
  name: "Source",
  components: {
    TeleportPopover,
    Url,
    CopyButton,
    SocialSharing,
    Validation: defineAsyncComponent(() => import('./Validation.vue'))
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
.teleport-popover.popover-large .stac-id .btn-sm,
.teleport-popover.popover-large .stac-valid .btn-sm {
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
    font-size: 0.7rem;
}

.teleport-popover.popover-large .popover-body {
  white-space: normal;
  min-width: 300px;
}
</style>
