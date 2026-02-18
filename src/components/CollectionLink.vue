<template>
  <section v-if="collection" class="parent-collection card-list mb-4">
    <h2>{{ $t('stacCollection', 1) }}</h2>
    <Catalog :catalog="collection" :showThumbnail="showThumbnail" />
  </section>
</template>

<script>
import Catalog from './Catalog.vue';
import { mapState } from 'pinia';
import { useDatabaseStore } from '../store/database';
import { useCatalogStore } from '../store/catalog';
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
    ...mapState(useDatabaseStore, ['getStac']),
    collection() {
      return this.getStac(this.link);
    }
  },
  watch: {
    link: {
      immediate: true,
      handler(newLink) {
        if (Utils.isObject(newLink)) {
          useCatalogStore().load({ url: newLink.href, omitApi: true });
        }
      }
    }
  }
};
</script>
