<template>
  <b-form-group :label="label" :label-for="id">
    <b-input-group size="sm">
      <b-form-input :id="id" ref="input" :value="url" readonly />
      <b-input-group-append>
        <CopyButton :copyText="url" variant="primary" />
        <b-button v-if="open" :href="url" target="_blank" variant="primary" :title="$t('open')"><b-icon-arrow-up-right-square /></b-button>
      </b-input-group-append>
    </b-input-group>
  </b-form-group>
</template>

<script>
import {
  BFormInput, BFormGroup,
  BIconArrowUpRightSquare,
  BInputGroup, BInputGroupAppend } from 'bootstrap-vue';

export default {
  name: "Share",
  components: {
    BFormGroup,
    BFormInput,
    BIconArrowUpRightSquare,
    BInputGroup,
    BInputGroupAppend,
    CopyButton: () => import('./CopyButton.vue')
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