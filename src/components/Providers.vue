<template>
  <section class="providers mb-4">
    <h2>{{ $tc('providers.title', count) }}</h2>
    <b-list-group v-if="isSimple" class="mimic-expandable-card">
      <b-list-group-item
        v-for="(provider, key) in providers" :key="key" :href="provider.url" :disabled="!provider.url"
        target="_blank" variant="provider" class="provider"
      >
        <span class="title">{{ provider.name }}</span>
        <ProviderRoles :roles="provider.roles" />
      </b-list-group-item>
    </b-list-group>
    <div v-else class="accordion" role="tablist">
      <Provider v-for="(provider, key) in providers" :key="key" :id="String(key)" :provider="provider" />
    </div>
  </section>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue';
import ProviderRoles from './ProviderRoles.vue';
import Utils from '../utils';

export default {
  name: 'Providers',
  components: {
    BListGroup,
    BListGroupItem,
    Provider: () => import('./Provider.vue'),
    ProviderRoles
  },
  props: {
    providers: {
      type: Array,
      required: true
    }
  },
  computed: {
    count() {
      return Utils.size(this.providers);
    },
    isSimple() {
      // We can show the providers much simpler if there are no additional information
      return !this.providers.find(provider => {
        const keys = ['url', 'name', 'roles'];
        return Object.keys(provider).filter(key => !keys.includes(key)).length > 0;
      });
    }
  }
};
</script>
