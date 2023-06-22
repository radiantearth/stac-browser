<template>
  <b-card class="provider expandable-card" no-body>
    <b-card-header header-tag="header" role="tab">
      <b-button block v-b-toggle="id" variant="provider" squared>
        <span class="chevron" aria-hidden="true">
          <b-icon-chevron-down v-if="expanded" />
          <b-icon-chevron-right v-else />
        </span>
        <span class="title">{{ provider.name }}</span>
        <ProviderRoles :roles="provider.roles" />
      </b-button>
    </b-card-header>
    <b-collapse :id="id" v-model="expanded" accordion="providers" role="tabpanel">
      <b-card-body>
        <b-button-group v-if="provider.url || provider.email || provider.mail">
          <b-button :href="provider.url" target="_blank" variant="primary">
            {{ $t('providers.homepage') }}
          </b-button>
          <b-button v-if="provider.email || provider.mail" :href="`mailto:${provider.email || provider.mail}`" target="_blank" variant="primary">
            {{ $t('providers.email') }}
          </b-button>
        </b-button-group>
        <b-card-text class="mt-4" v-if="provider.description">
          <Description :description="provider.description" compact />
        </b-card-text>
        <Metadata class="mt-4" :data="provider" :ignoreFields="ignore" :title="false" type="Provider" />
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconChevronRight, BIconChevronDown } from 'bootstrap-vue';
import Description from './Description.vue';
import ProviderRoles from './ProviderRoles.vue';

export default {
  name: 'Provider',
  components: {
    BCollapse,
    BIconChevronDown,
    BIconChevronRight,
    Description,
    Metadata: () => import('./Metadata.vue'),
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
