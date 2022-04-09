<template>
  <section class="providers mb-4">
    <h2>Providers</h2>
    <b-list-group v-if="isSimple">
      <b-list-group-item v-for="(provider, key) in providers" :key="key" :href="provider.url" :disabled="!provider.url" target="_blank" variant="provider" class="provider">
        {{ provider.name }}
        <div class="roles ml-1" v-if="Array.isArray(provider.roles)">
          <b-badge v-for="role in provider.roles" :key="role" variant="secondary" class="ml-1 mb-1">{{ role }}</b-badge>
        </div>
      </b-list-group-item>
    </b-list-group>
    <div v-else class="accordion" role="tablist">
      <Provider v-for="(provider, key) in providers" :key="key" :id="String(key)" :provider="provider" />
    </div>
  </section>
</template>

<script>
import { BListGroup, BListGroupItem } from 'bootstrap-vue';

export default {
  name: 'Providers',
  components: {
    BListGroup,
    BListGroupItem,
    Provider: () => import('./Provider.vue')
  },
  props: {
    providers: {
      type: Array,
      required: true
    }
  },
  computed: {
    isSimple() {
      // We can show the providers much simpler if there are no additional information
      return !this.providers.find(provider => {
        const keys = ['url', 'name', 'roles'];
        return Object.keys(provider).filter(key => !keys.includes(key)).length > 0;
      });
    }
  }
}
</script>

<style lang="scss">
@import "../theme/variables.scss";

#stac-browser .providers {
  .list-group-item-provider, .btn-provider {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.8rem;
    background-color: rgba(0,0,0,0.03);
    
    .badge {
      text-transform: uppercase;
    }
  }
}
</style>

