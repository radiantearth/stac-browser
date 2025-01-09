<template>
  <b-list-group-item button class="auth-method-item flex-column align-items-start" @click="authenticate">
    <div class="d-flex w-100 justify-content-between align-items-center">
      <strong class="mr-2">{{ $i18n.t(`authentication.schemeTypes.${method.type}`, method) }}</strong>
      <b-badge v-if="!isSupported" variant="danger">{{ $i18n.t("authentication.unsupported") }}</b-badge>
    </div>
  </b-list-group-item>
</template>

<script>
import { BListGroupItem } from 'bootstrap-vue';
import AuthUtils from './auth/utils';

export default {
  name: 'AuthSchemeItem',
  components: {
    BListGroupItem
  },
  props: {
    method: {
      type: Object,
      required: true
    }
  },
  computed: {
    isSupported() {
      return AuthUtils.isSupported(this.method, this.$store.state);
    }
  },
  methods: {
    authenticate() {
      this.$emit('authenticate', this.method);
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
