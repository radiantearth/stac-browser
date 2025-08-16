<template>
  <b-alert class="deprecation" :variant="variant" show>
    <h3>{{ title }}</h3>
    <Description :description="message" inline />
    <ul v-if="latestLink || successorLink || predecessorLink">
      <li v-if="latestLink">
        {{ $t('deprecation.latestVersion') }}
        <StacLink :data="latestLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
      <li v-if="successorLink">
        {{ $t('deprecation.successorVersion') }}
        <StacLink :data="successorLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
      <li v-if="predecessorLink">
        {{ $t('deprecation.predecessorVersion') }}
        <StacLink :data="predecessorLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
    </ul>
  </b-alert>
</template>

<script>
import Description from './Description.vue';

export default {
  name: 'DeprecationNotice',
  components: {
    StacLink: () => import('./StacLink.vue'),
    Description
  },
  props: {
    data: {
      type: Object,
      default: null
    }
  },
  computed: {
    message() {
      let vars = {type: this.type};
      if (this.isDeprecated) {
        return this.$t('deprecation.warning', vars);

      }
      else {
        return this.$t('deprecation.otherVersionsNotice', vars);
      }
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
        return this.$tc('stacItem');
      }
      else if (this.data.isCollection()) {
        return this.$tc(`stacCollection`);
      }
      else if (this.data.isCatalog()) {
        return this.$tc(`stacCatalog`);
      }
      else {
        return '';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.deprecation {
  h3 {
    font-size: 1em;
    font-weight: bold;
    display: inline-block;
    margin: 0;
    margin-right: 1em;
  }
  ul {
    margin-top: 0.5em;
    margin-bottom: 0;
  }
}
</style>