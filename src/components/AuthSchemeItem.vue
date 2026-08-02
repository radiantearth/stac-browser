<template>
  <b-list-group-item button class="auth-method-item flex-column align-items-start" @click="authenticate">
    <div class="d-flex w-100 justify-content-between align-items-center">
      <strong class="me-2">{{ scheme.title || $t(`authentication.schemeTypes.${scheme.type}`, scheme) }}</strong>
      <b-badge v-if="!supported" variant="danger">{{ $t("authentication.unsupported") }}</b-badge>
    </div>
  </b-list-group-item>
</template>

<script>
import { isSupported } from '../auth/schemes.js';

export default {
  name: 'AuthSchemeItem',
  props: {
    schemeId: {
      type: String,
      required: true
    },
    scheme: {
      type: Object,
      required: true
    }
  },
  emits: ['authenticate'],
  computed: {
    supported() {
      return isSupported(this.scheme, this.$store.state);
    }
  },
  methods: {
    authenticate() {
      this.$emit('authenticate', { id: this.schemeId, scheme: this.scheme });
    }
  }
};
</script>

<style lang="scss" scoped>
.auth-method-item {
  border-left: 0;
  border-right: 0;

  &:last-of-type {
    border-bottom: 0;
  }
  &:first-of-type {
    border-top: 0;
  }
}
</style>
