<template>
  <div></div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'OidcLoginCallback',
  async beforeMount () {
    try {
      await this.$auth.handleLoginRedirect();
      await this.setAuth(this.$auth.getAccessToken());
    } catch (error) {
      const isInteractionRequiredError = this.$auth.isInteractionRequiredError || this.$auth.idx.isInteractionRequiredError;
      if (isInteractionRequiredError(error)) {
        const { onAuthResume, onAuthRequired } = this.$auth.options;
        const callbackFn = onAuthResume || onAuthRequired;
        if (callbackFn) {
          callbackFn(this.$auth);
          return;
        }
      }
      this.$store.commit('showGlobalError', { error,  message: "Login failed" });
    }
  },
  methods: {
    ...mapActions(['setAuth'])
  }
};
</script>