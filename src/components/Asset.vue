<template>
  <b-card :title="asset.title || asset.href">
    <b-button-group>
      <b-button href="#" variant="primary">Details</b-button>&nbsp;
      <b-button :href="asset.href" target="_blank" variant="primary">Download</b-button>
    </b-button-group>
  </b-card>
</template>

<script>
export default {
  name: 'Asset',
  props: {
    asset: {
      type: Object,
      required: true
    }
  }
}
</script>