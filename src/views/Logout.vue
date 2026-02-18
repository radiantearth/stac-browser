<template>
  <main class="auth d-flex flex-column">
    <b-alert variant="success" show>
      <p class="message">{{ $t('authentication.loggedOut') }}</p>
    </b-alert>
  </main>
</template>

<script>
import { defineComponent } from 'vue';

import { useAuthStore } from '../store/auth';

export default defineComponent({
  name: "Logout",
  async created() {
    await useAuthStore().finalizeLogout();
  }
});
</script>

<style lang="scss" scoped>
.message {
  margin-bottom: 0;
}
</style>
