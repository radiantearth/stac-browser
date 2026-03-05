<template>
  <b-button class="copy-button" @click.prevent.stop="copy" v-bind="resolvedButtonProps">
    <component :is="copyIcon" />
    <slot />
  </b-button>
</template>

<script>
import { useClipboard } from '@vueuse/core';
import BIconClipboard from '~icons/bi/clipboard';
import BIconClipboardCheck from '~icons/bi/clipboard-check';
import BIconClipboardX from '~icons/bi/clipboard-x';

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
        size: {
            type: String,
            default: "md"
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
    setup() {
        const { copy, isSupported } = useClipboard();
        return {
            copyToClipboard: copy,
            isClipboardSupportedState: isSupported
        };
    },
    computed: {
        isClipboardSupported() {
            return Boolean(this.isClipboardSupportedState);
        },
        resolvedButtonProps() {
            return {
                disabled: Boolean(this.buttonProps?.disabled) || !this.isClipboardSupported,
                variant: this.copyColor,
                size: this.size,
                title: this.buttonTitle,
                'aria-label': this.buttonTitle || this.$t('copy'),
                ...this.buttonProps,
            };
        },
        copyColor() {
            let variant = this.variant;
            if (!this.isClipboardSupported) {
                variant = 'secondary';
            }
            else if (this.status === true) {
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
            if (!this.isClipboardSupported) {
                return BIconClipboardX;
            }
            if (this.status === true) {
                return BIconClipboardCheck;
            }
            else if (this.status === false) {
                return BIconClipboardX;
            }
            return BIconClipboard;
        },
        buttonTitle() {
            if (!this.isClipboardSupported) {
                return this.$t('copyErrors.unsupported');
            }
            if (this.status === false) {
                return this.$t('copyErrors.permission');
            }
            return this.$t('copy');
        }
    },
    methods: {
        async copy() {
            const focusedElement = typeof document !== 'undefined' ? document.activeElement : null;
            try {
                if (!this.isClipboardSupported) {
                    throw new Error(this.$t('copyErrors.unsupported'));
                }
                await this.copyToClipboard(this.copyText);
                this.status = true;
            } catch(error) {
                console.error('Copy failed:', error);
                this.status = false;
            }
            finally {
                if (focusedElement && typeof focusedElement.focus === 'function') {
                    focusedElement.focus();
                }
                setTimeout(() => {
                    this.status = null;
                }, 3000);
            }
        }
    }
};
</script>
