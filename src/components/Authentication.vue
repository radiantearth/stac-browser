<template>
  <component :is="authComponent" @submit="submit" @reset="reset" />
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'Authentication',
  components: {
    ApiKey: () => import('./auth/ApiKey.vue'),
    Basic: () => import('./auth/Basic.vue')
  },
  computed: {
    ...mapGetters('auth', ['method', 'isLoggedIn']),
    authComponent() {
      return this.method.getComponent();
    },
    authComponentProps() {
      return this.method.getComponentProps();
    }
  },
  beforeCreate() {
    if (this.isLoggedIn) {
      this.$store.dispatch('auth/finalizeLogout');
    }
  },
  methods: {
    async reset() {
      await this.$store.dispatch('auth/abortLogin');
    },
    async submit(credentials) {
      await this.$store.dispatch('auth/finalizeLogin', credentials);
    }
  }
};
</script>
