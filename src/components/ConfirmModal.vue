<template>
  <b-modal :title="title" :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @hide="$emit('cancel')">
    <slot />
    <template #footer>
      <b-button :variant="variant" :disabled="busy" @click="$emit('confirm')">
        <b-spinner v-if="busy" small />
        {{ confirmLabel }}
      </b-button>
      <b-button variant="secondary" @click="$emit('update:modelValue', false)">
        {{ $t('cancel') }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import { defineAsyncComponent } from 'vue';

/**
 * A modal that asks the user to confirm an action.
 *
 * The `confirm` event is emitted when the user confirms; the modal is not
 * closed automatically so that the action can show its progress through
 * `busy` - close it by setting the v-model to `false` once done.
 * The `cancel` event is emitted whenever the modal is hidden, including
 * after a confirmation - handlers must tolerate that (e.g. by resetting
 * state that the confirmation has already cleared).
 */
export default {
  name: 'ConfirmModal',
  components: {
    BModal: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BModal))
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: true
    },
    confirmLabel: {
      type: String,
      required: true
    },
    variant: {
      type: String,
      default: 'danger'
    },
    busy: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel']
};
</script>
