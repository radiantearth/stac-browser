<template>
  <b-form-group :label="label" :label-for="id">
    <b-input-group size="sm">
      <b-form-input :id="id" ref="input" :value="url" readonly />
      <template #append>
        <CopyButton :copyText="url" variant="primary" />
        <b-button v-if="open" :href="url" target="_blank" variant="primary" :title="$t('open')"><IBiArrowUpRightSquare /></b-button>
      </template>
    </b-input-group>
  </b-form-group>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { BFormInput, BFormGroup, BInputGroup } from 'bootstrap-vue-next';

export default {
  name: "Share",
  components: {
    BFormGroup,
    BFormInput,
    BInputGroup,
    CopyButton: defineAsyncComponent(() => import('./CopyButton.vue'))
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
  }
};
</script>

<style lang="scss" scoped>
.popover {
  width: 100%;
  max-width: 800px;
}
</style>