<template>
  <main class="auth d-flex flex-column">
    <ErrorAlert v-if="error" message="Login failed" :error="error" :dismissible="false" />
    <Loading v-else stretch />
  </main>
</template>

<script>
import { mapGetters } from 'vuex';
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';

export default {
  name: "AuthCallback",
  components: {
    ErrorAlert,
    Loading
  },
  data() {
    return {
      error: null
    };
  },
  computed: {
    ...mapGetters('auth', ['method'])
  },
  watch: {
    method: {
      immediate: true,
      async handler(method) {
        if (method.getType() === null) {
          return;
        }
        try {
          await this.method.loginCallback();
        }
        catch (error) {
          console.error(error);
          this.error = error;
        }
      }
    }
  }
};
</script>