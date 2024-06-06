<template>
  <main class="auth d-flex flex-column">
    <ErrorAlert v-if="error" message="Login failed" :error="error" />
    <Loading v-else stretch />
  </main>
</template>

<script>
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import { mapActions, mapGetters } from 'vuex/dist/vuex.common.js';
export default {
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
    ...mapGetters('auth', ['method'])
  },
  watch: {
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
    ...mapActions('auth', ['finalizeLogin'])
  }
};
</script>
