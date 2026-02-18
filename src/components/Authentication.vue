<template>
  <component :is="authComponent" @submit="submit" @reset="reset" />
</template>

<script>
import { mapState } from 'pinia';
import { useAuthStore } from '../store/auth';
import { defineAsyncComponent } from 'vue';

export default {
  name: 'Authentication',
  components: {
    ApiKey: defineAsyncComponent(() => import('./auth/ApiKey.vue')),
    Basic: defineAsyncComponent(() => import('./auth/Basic.vue'))
  },
  computed: {
    ...mapState(useAuthStore, ['method', 'isLoggedIn']),
    authComponent() {
      return this.method.getComponent();
    },
    authComponentProps() {
      return this.method.getComponentProps();
    }
  },
  beforeCreate() {
    if (this.isLoggedIn) {
      useAuthStore().finalizeLogout();
    }
  },
  methods: {
    async reset() {
      await useAuthStore().abortLogin();
    },
    async submit(credentials) {
      await useAuthStore().finalizeLogin(credentials);
    }
  }
};
</script>
