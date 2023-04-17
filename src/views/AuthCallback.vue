<template>
    <main class="auth d-flex flex-column">
        <ErrorAlert v-if="error" message="Login failed" :dismissible="false" />
        <Loading v-else stretch />
    </main>
</template>

<script>
import { mapState } from 'vuex';
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
        ...mapState('auth', ['method'])
    },
    watch: {
        method: {
            immediate: true,
            async handler(method) {
                if (method.getType() === null) {
                    return;
                }
                try {
                    await this.$store.dispatch('auth/loginCallback');
                }
                catch (error) {
                    this.error = error;
                }
            }
        }
    }
};
</script>