<template>
  <section class="providers mb-4">
    <SectionHeading :id="id">{{ $t('providers.title', count) }}</SectionHeading>
    <b-list-group v-if="isSimple" class="mimic-accordion">
      <b-list-group-item
        v-for="(provider, key) in providers" :key="key" :href="provider.url" :disabled="!provider.url"
        target="_blank" rel="noopener noreferrer" variant="provider" class="provider"
      >
        <span class="title">{{ provider.name }}</span>
        <ProviderRoles :roles="provider.roles" />
      </b-list-group-item>
    </b-list-group>
    <b-accordion v-else>
      <Provider v-for="(provider, key) in providers" :key="key" :id="String(key)" :provider="provider" />
    </b-accordion>
  </section>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import ProviderRoles from './ProviderRoles.vue';
import SectionHeading from './SectionHeading.vue';
import { size } from 'stac-js/src/utils.js';
import { BAccordion } from 'bootstrap-vue-next';

export default {
  name: 'Providers',
  components: {
    Provider: defineAsyncComponent(() => import('./Provider.vue')),
    BAccordion,
    ProviderRoles,
    SectionHeading
  },
  props: {
    providers: {
      type: Array,
      required: true
    },
    // Stable anchor id for the heading, e.g. "providers".
    // Leave empty where the component renders more than once per page.
    id: {
      type: String,
      default: null
    }
  },
  computed: {
    count() {
      return size(this.providers);
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
