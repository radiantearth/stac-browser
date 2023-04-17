<template>
  <ErrorAlert v-if="error" message="Login failed" :dismissible="false" />
</template>

<script>
import { mapActions } from 'vuex';
import ErrorAlert from '../components/ErrorAlert.vue';

export default {
    name: "OidcLoginCallback",
    components: {
        ErrorAlert
    },
    data() {
        return {
            error: null
        };
    },
    async beforeMount() {
        try {
            await this.$auth.handleLoginRedirect();
        }
        catch (error) {
            this.error = error;
        }
    }
};
</script>