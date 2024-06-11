<template>
  <main class="auth d-flex flex-column">
    <b-alert variant="success" show>
      <p class="message">{{ $t('authentication.loggedOut') }}</p>
    </b-alert>
  </main>
</template>

<script>
export default {
  name: "Logout",
  async created() {
    await this.$store.dispatch("auth/finalizeLogout");
  }
};
</script>

<style lang="scss" scoped>
.message {
  margin-bottom: 0;
}
</style>
