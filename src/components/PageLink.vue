<template>
  <router-link v-if="link" :to="link"><slot>{{ title }}</slot></router-link>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'PageLink',
  props: {
    page: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters(['pageLink', 'pageTitle']),
    link() {
      return this.pageLink(this.page);
    },
    title() {
      return this.pageTitle(this.page);
    }
  }
};
</script>
