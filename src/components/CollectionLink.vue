<template>
  <section v-if="collection" class="parent-collection card-list mb-4">
    <h2>{{ $t('stacCollection', 1) }}</h2>
    <Catalog :catalog="collection" :showThumbnail="showThumbnail" />
  </section>
</template>

<script>
import Catalog from './Catalog.vue';
import { mapGetters } from 'vuex';
import Utils from '../utils';

export default {
  name: "CollectionLink",
  components: {
    Catalog
  },
  props: {
    link: {
      type: Object,
      required: true
    },
    showThumbnail: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapGetters(['getStac']),
    collection() {
      return this.getStac(this.link);
    }
  },
  watch: {
    link: {
      immediate: true,
      handler(newLink) {
        if (Utils.isObject(newLink)) {
          this.$store.dispatch("load", { url: newLink.href, omitApi: true });
        }
      }
    }
  }
};
</script>
