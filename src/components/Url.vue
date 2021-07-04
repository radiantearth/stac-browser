<template>
    <b-form-group :label="label" :label-for="id">
        <b-input-group size="sm">
            <b-form-input :id="id" ref="input" v-model="url" readonly></b-form-input>
            <b-input-group-append>
                <b-button @click="copyUrl" :variant="copyColor"><component :is="copyIcon" /></b-button>
                <b-button v-if="open" :href="url" target="_blank" variant="primary"><b-icon-arrow-up-right-square /></b-button>
            </b-input-group-append>
        </b-input-group>
    </b-form-group>
</template>

<script>
import {
    BFormInput, BFormGroup,
    BIconClipboard, BIconClipboardCheck, BIconArrowUpRightSquare,
    BInputGroup, BInputGroupAppend } from 'bootstrap-vue';

export default {
    name: "Share",
    components: {
        BFormGroup,
        BFormInput,
        BIconClipboard,
        BIconClipboardCheck,
        BIconArrowUpRightSquare,
        BInputGroup,
        BInputGroupAppend
    },
    props: {
        id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        open: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            copyConfirm: false
        };
    },
    computed: {
        copyColor() {
            return this.copyConfirm ? 'success' : 'primary';
        },
        copyIcon() {
            return this.copyConfirm ? 'b-icon-clipboard-check' : 'b-icon-clipboard';
        }
    },
    methods: {
        copyUrl() {
            this.copyConfirm = true;
            this.$clipboard(this.url);
            setTimeout(() => this.copyConfirm = false, 2500);
        }
    }
}
</script>

<style lang="scss" scoped>
.popover {
    width: 100%;
    max-width: 800px;
}
.twitter {
    background-color: #1DA1F2;
}
</style>