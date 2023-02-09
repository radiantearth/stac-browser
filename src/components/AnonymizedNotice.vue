<template>
  <b-alert class="anonymized" variant="warning" show>
    <strong>{{ $t('anonymized.title') }}</strong>&nbsp;
    <small>{{ warning }}</small>
  </b-alert>
</template>

<script>
export default {
  name: 'AnonymizedNotice',
  props: {
    warning: {
      type: String,
      required: true
    }
  }
};
</script>