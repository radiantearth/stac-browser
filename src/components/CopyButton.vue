<template>
  <b-button class="copy-button" @click.prevent.stop="copy" :variant="copyColor" v-bind="buttonProps" :title="$t('copy')">
    <component :is="copyIcon" />
    <slot />
  </b-button>
</template>

<script>
import { BIconClipboard, BIconClipboardCheck, BIconClipboardX } from 'bootstrap-vue';
import { Clipboard } from "v-clipboard";

export default {
    name: "CopyButton",
    components: {
        BIconClipboard,
        BIconClipboardCheck,
        BIconClipboardX
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
            status: null
        };
    },
    computed: {
        copyColor() {
            let variant = this.variant;
            if (this.status === true) {
                variant = 'success';
            }
            else if (this.status === false) {
                variant = 'danger';
            }
            if (this.variant.startsWith('outline-')) {
                variant = 'outline-' + variant;
            }
            return variant;
        },
        copyIcon() {
            if (this.status === true) {
                return 'b-icon-clipboard-check';
            }
            else if (this.status === false) {
                return 'b-icon-clipboard-x';
            }
            else {
                return 'b-icon-clipboard';
            }
        }
    },
    methods: {
        async copy() {
            try {
                // We need to store the focus and restore it again as the clipboard 
                // may steal the focus
                let focus = document.activeElement;
                await Clipboard.copy(this.copyText);
                focus.focus();
                this.status = true;
            } catch(error) {
                console.error(error);
                this.status = false;
            }
            setTimeout(() => this.status = null, 2500);
        }
    }
};
</script>
