<template>
  <b-accordion-item v-model="expanded" :id="id" class="provider">
    <template #title>
      <span class="chevron" aria-hidden="true">
        <b-icon-chevron-down v-if="expanded" />
        <b-icon-chevron-right v-else />
      </span>
      <span class="title">{{ provider.name }}</span>
      <ProviderRoles :roles="provider.roles" />
    </template>
    <div class="provider-details">
      <b-button-group v-if="provider.url || provider.email || provider.mail">
        <b-button :href="provider.url" target="_blank" variant="primary">
          {{ $t('providers.homepage') }}
        </b-button>
        <b-button v-if="provider.email || provider.mail" :href="`mailto:${provider.email || provider.mail}`" target="_blank" variant="primary">
          {{ $t('providers.email') }}
        </b-button>
      </b-button-group>
      <div class="mt-4" v-if="provider.description">
        <Description :description="provider.description" compact />
      </div>
      <MetadataGroups class="mt-4" :data="provider" :ignoreFields="ignore" :title="false" type="Provider" />
    </div>
  </b-accordion-item>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import Description from './Description.vue';
import ProviderRoles from './ProviderRoles.vue';
import { BAccordionItem } from 'bootstrap-vue-next';

export default {
  name: 'Provider',
  components: {
    Description,
    BAccordionItem,
    MetadataGroups: defineAsyncComponent(() => import('./MetadataGroups.vue')),
    ProviderRoles
  },
  props: {
    provider: {
      type: Object,
      required: true
    },
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      expanded: false,
      ignore: ['url', 'name', 'description', 'roles']
    };
  }
};
</script>

<style lang="scss">
#stac-browser {
  .provider {
    .metadata {
      .card-columns {
        column-count: 1;
      }
      .card-body {
        padding: 0;
      }
    }
  }
}
</style>
