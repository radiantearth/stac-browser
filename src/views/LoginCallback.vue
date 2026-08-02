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
import { mapActions, mapGetters, mapState } from 'vuex';

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
    ...mapState(['globalError']),
    ...mapGetters('auth', ['activeMethod'])
  },
  watch: {
    globalError: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.error = newValue;
          this.$store.commit('showGlobalError', null);
        }
      }
    },
    activeMethod: {
      immediate: true,
      async handler(method) {
        if (!method) {
          // The method is restored asynchronously at startup (see auth/restore)
          return;
        }
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
});
</script>
