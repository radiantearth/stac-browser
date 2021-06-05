<template>
  <router-link :to="href" :target="target">{{ displayTitle }}</router-link>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "StacLink",
  props: {
    link: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      default: null
    },
    target: {
      type: String,
      default: null
    }
  },
  computed: {
    ...mapGetters(['toBrowserPath']),
    href() {
      switch(this.link.rel) {
        case 'root':
          return '/';
        case 'child':
        case 'parent':
        case 'item':
          return this.toBrowserPath(this.link.href);
        default:
          return this.link.href;
      }
    },
    displayTitle() {
      return this.title || this.link.title || this.link.href; // ToDo: shorten href
    }
  }
};
</script>