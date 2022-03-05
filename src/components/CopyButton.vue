<template>
    <b-button @click="copy" :variant="copyColor" v-bind="buttonProps">
        <component :is="copyIcon" />
        <slot></slot>    
    </b-button>
</template>

<script>
import { BIconClipboard, BIconClipboardCheck } from 'bootstrap-vue';

export default {
    name: "CopyButton",
    components: {
        BIconClipboard,
        BIconClipboardCheck
    },
    props: {
        copyText: {
            type: String,
            required: true
        },
        variant: {
            type: String,
            default: "primary"
        },
        buttonProps: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            copyConfirm: false
        };
    },
    computed: {
        copyColor() {
            if (this.copyConfirm) {
                if (this.variant.startsWith('outline-')) {
                    return 'outline-success';
                }
                else {
                    return 'success';
                }
            }
            else {
                return this.variant;
            }
        },
        copyIcon() {
            return this.copyConfirm ? 'b-icon-clipboard-check' : 'b-icon-clipboard';
        }
    },
    methods: {
        copy() {
            this.copyConfirm = true;
            this.$clipboard(this.copyText);
            setTimeout(() => this.copyConfirm = false, 2500);
        }
    }
}
</script>