<template>
  <b-alert variant="danger" show @dismissed="$emit('close')" :dismissible="dismissible">
    <p class="message">{{ message || $t('errors.default') }}</p>
    <dl class="error" v-if="error && error.message">
      <dt>{{ $t('errors.labels.cause') }}</dt>
      <dd>{{ error.message }}</dd>
    </dl>
    <dl class="description" v-if="description">
      <dt>{{ $t('errors.labels.reason') }}</dt>
      <dd>{{ description }}</dd>
    </dl>
    <dl class="id" v-if="id">
      <dt>{{ $t('errors.labels.code') }}</dt>
      <dd><code>{{ id }}</code></dd>
    </dl>
    <dl class="url" v-if="url">
      <dt>{{ $t('errors.labels.requestURL') }}</dt>
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
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    error: {
      type: [
        Object,
        Error
      ],
      default: null
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
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
.alert {
  margin-bottom: 0;
}
.message {
  font-weight: bold;

  &:last-child {
    margin-bottom: 0;
  }
}
dl {
  font-size: 0.9em;
}
</style>
