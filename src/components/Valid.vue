<template>
    <span>
        <b-spinner v-if="valid === null" label="Validating..." small></b-spinner>
        <template v-else-if="valid === true">✔️</template>
        <template v-else-if="valid === false">❌</template><!-- ToDo: Link to staclint -->
        <template v-else>n/a</template>
    </span>
</template>

<script>
import { mapState } from 'vuex';

export default {
    name: "Share",
    props: {
        stacUrl: {
            type: String,
            required: true
        }
    },
    created() {
        this.$store.dispatch('validate', this.stacUrl);
    },
    computed: {
        ...mapState(['valid']),
    }
}
</script>