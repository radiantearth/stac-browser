<template>
  <b-alert v-if="isExternalContext" class="external-warning" :variant="variant" show>
    {{ $t('externalInfo', {type}) }}
  </b-alert>
</template>

<script>
import { mapGetters, mapState } from 'vuex';

export default {
  name: "ExternalWarning",
  props: {
    variant: {
      type: String,
      default: 'info'
    }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['isExternalContext']),
    type() {
      if (this.data?.isItem) {
        return this.$t('stacItem', 1);
      }
      else if (this.data?.isCollection) {
        return this.$t('stacCollection', 1);
      }
      else if (this.data?.isCatalog) {
        return this.$t('stacCatalog', 1);
      }
      else {
        return this.$t('stacEntity', 1);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../theme/variables.scss";

.external-warning {
  margin-bottom: $block-gap;
}
</style>
