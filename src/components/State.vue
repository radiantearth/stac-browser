<template>
    <section>
        <div v-if="loading" class="loading text-center">
            <b-spinner label="Loading..."></b-spinner>
        </div>
        <b-alert v-else-if="error" variant="danger" show>
            <p>{{ error }}</p>
            <p>Please note that some servers don't allow external access via web browsers (e.g., when CORS headers are not present).</p>
            <p><small>Requested URL: <a :href="url">{{ url }}</a></small></p>
        </b-alert>
        <slot v-else></slot>
    </section>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: "State",
    computed: {
        ...mapState(['loading', 'error', 'url'])
    }
}
</script>