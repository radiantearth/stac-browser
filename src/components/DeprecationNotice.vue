<template>
  <b-alert :variant="variant" show>
    <strong>{{ title }}</strong>&nbsp;
    <small v-if="isDeprecated">
      {{ $t('deprecation.warning', {type}) }}
    </small>
    <small v-else>{{ $t('deprecation.otherVersionsNotice', {type}) }}</small>
    <ul v-if="latestLink || successorLink || predecessorLink">
      <li v-if="latestLink"><small><StacLink :data="latestLink" :fallbackTitle="latestTitle" :tooltip="latestTitle" /></small></li>
      <li v-if="successorLink"><small><StacLink :data="successorLink" :fallbackTitle="successorTitle" :tooltip="successorTitle" /></small></li>
      <li v-if="predecessorLink"><small><StacLink :data="predecessorLink" :fallbackTitle="predecessorTitle" :tooltip="predecessorTitle" /></small></li>
    </ul>
  </b-alert>
</template>

<script>
export default {
  name: 'DeprecationNotice',
  components: {
    StacLink: () => import('./StacLink.vue')
  },
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  computed: {
    latestTitle() {
      return this.$t('deprecation.goToLatest');
    },
    successorTitle() {
      return this.$t('deprecation.goToSuccessor');
    },
    predecessorTitle() {
      return this.$t('deprecation.goToPredecessor');
    },
    latestLink() {
      return this.data.getStacLinkWithRel('latest-version');
    },
    successorLink() {
      return this.data.getStacLinkWithRel('successor-version');
    },
    predecessorLink() {
      // Show prev. link only if not deprecated
      return !this.isDeprecated && this.data.getStacLinkWithRel('predecessor-version');
    },
    variant() {
      return this.isDeprecated ? 'warning' : 'info';
    },
    isDeprecated() {
      return Boolean(this.data.isItem() ? this.data.properties.deprecated : this.data.deprecated);
    },
    title() {
      if (this.isDeprecated) {
        return this.$t('deprecated');
      }
      else if (this.latestLink || this.successorLink) {
        return this.$t('deprecation.outdatedTitle');
      }
      else {
        return this.$t('deprecation.otherVersionsTitle');
      }
    },
    type() {
      if (this.data.isItem()) {
        return this.$t('stacItem');
      }
      else if (this.data.isCollection()) {
        return this.$t(`stacCollection`);
      }
      else if (this.data.isCatalog()) {
        return this.$t(`stacCatalog`);
      }
      else {
        return '';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
ul {
  margin-top: 0.5em;
  margin-bottom: 0;
}
</style>