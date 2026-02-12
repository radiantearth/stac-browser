<template>
  <b-alert class="deprecation" :variant="variant" show>
    <h3>{{ title }}</h3>
    <Description :description="message" inline />
    <ul v-if="latestLink || successorLink || predecessorLink">
      <li v-if="latestLink" class="latest">
        {{ $t('deprecation.latestVersion') }}
        <StacLink :data="latestLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
      <li v-if="successorLink" class="successor">
        {{ $t('deprecation.successorVersion') }}
        <StacLink :data="successorLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
      <li v-if="predecessorLink" class="predecessor">
        {{ $t('deprecation.predecessorVersion') }}
        <StacLink :data="predecessorLink" :fallbackTitle="$t('deprecation.fallbackTitle')" />
      </li>
    </ul>
  </b-alert>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import Description from './Description.vue';
import DeprecationMixin from './DeprecationMixin';

export default {
  name: 'DeprecationNotice',
  components: {
    StacLink: defineAsyncComponent(() => import('./StacLink.vue')),
    Description
  },
  mixins: [
    DeprecationMixin
  ],
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
    variant() {
      return this.isDeprecated ? 'warning' : 'info';
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
        return this.$t('stacItem', 1);
      }
      else if (this.data.isCollection()) {
        return this.$t(`stacCollection`, 1);
      }
      else if (this.data.isCatalog()) {
        return this.$t(`stacCatalog`, 1);
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
    font-weight: 700;
    display: inline-block;
    margin: 0;
    margin-right: 1em;
  }
  ul {
    margin-top: 0.5em;
    margin-bottom: 0;
  }
  li {
    &.latest {
      font-weight: 600;
    }
    &.successor {
      font-weight: 500;
    }
    &.predecessor {
      font-weight: 500;
    }
  }
}
</style>
