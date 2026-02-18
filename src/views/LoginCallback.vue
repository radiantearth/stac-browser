<template>
  <main class="auth d-flex flex-column">
    <ErrorAlert v-if="error" message="Login failed" :error="error" />
    <Loading v-else stretch />
  </main>
</template>

<script>
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { defineComponent } from 'vue';
import { mapState, mapActions } from 'pinia';
import { usePageStore } from '../store/page';
import { useAuthStore } from '../store/auth';

export default defineComponent({
  name: "LoginCallback",
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
    ...mapState(usePageStore, ['globalError']),
    ...mapState(useAuthStore, ['method'])
  },
  watch: {
    globalError: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.error = newValue;
          usePageStore().showGlobalError(null);
        }
      }
    },
    method: {
      immediate: true,
      async handler() {
        try {
          await this.finalizeLogin();
        } catch (error) {
          this.error = error;
        }
      }
    }
  },
  methods: {
    ...mapActions(useAuthStore, ['finalizeLogin'])
  }
});
</script>
