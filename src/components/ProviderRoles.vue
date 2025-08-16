<template>
  <div class="roles badges" v-if="Array.isArray(roles)">
    <b-badge v-for="role in roles" :key="role" variant="secondary">
      {{ displayRole(role) }}
    </b-badge>
  </div>
</template>

<script>
export default {
  name: 'ProviderRoles',
  props: {
    roles: {
      type: Array,
      default: null
    }
  },
  methods: {
    displayRole(role) {
      let key = `providers.role.${role}`;
      if (this.$te(key)) {
        return this.$t(key);
      }
      return role;
    }
  }
};
</script>

<style lang="scss" scoped>
.badge {
  text-transform: uppercase;
}
</style>