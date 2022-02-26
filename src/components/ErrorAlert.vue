<template>
  <b-alert variant="danger" show @dismissed="$emit('close')" :dismissible="dismissible">
    <p class="message">{{ message }}</p>
    <dl class="error" v-if="error && error.message">
      <dt>Caused by:</dt>
      <dd>{{ error.message }}</dd>
    </dl>
    <dl class="description" v-if="description">
      <dt>Reasoning:</dt>
      <dd>{{ description }}</dd>
    </dl>
    <dl class="id" v-if="id">
      <dt>Error code:</dt>
      <dd><code>{{ id }}</code></dd>
    </dl>
    <dl class="url" v-if="url">
      <dt>Requested URL:</dt>
      <dd><code>{{ url }}</code></dd>
    </dl>
  </b-alert>
</template>

<script>
export default {
  name: 'ErrorAlert',
  props: {
    message: {
      type: String,
      default: 'Sorry, the requested page could not be loaded.'
    },
    description: {
      type: String,
      default: ''
    },
    error: {
      type: [
        Object,
        Error
      ]
    },
    id: {
      type: [
        String,
        Number
      ],
      default: null
    },
    url: {
      type: String,
      default: ''
    },
    dismissible: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style lang="scss" scoped>
.message {
  font-weight: bold;
}
dl {
  font-size: 0.9em;
}
</style>