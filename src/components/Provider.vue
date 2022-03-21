<template>
  <b-card class="provider" no-body>
    <b-card-header header-tag="header" role="tab" class="p-0">
      <b-button block v-b-toggle="id" variant="provider" squared class="p-2 d-flex">
        <span class="roles mr-1" aria-hidden="true">
          <b-icon-chevron-down v-if="expanded" />
          <b-icon-chevron-right v-else />
        </span>
        {{ provider.name }}
        <div class="roles ml-1" v-if="Array.isArray(provider.roles)">
          <b-badge v-for="role in provider.roles" :key="role" variant="secondary" class="ml-1 mb-1">{{ role }}</b-badge>
        </div>
      </b-button>
    </b-card-header>
    <b-collapse :id="id" v-model="expanded" accordion="providers" role="tabpanel">
      <b-card-body>
        <b-button-group v-if="provider.url">
          <b-button :href="provider.url" target="_blank" variant="outline-primary">
            Go to homepage
          </b-button>
          <b-button v-if="provider.email || provider.mail" :href="`mailto:${provider.email || provider.mail}`" target="_blank" variant="outline-primary">
            Send e-mail
          </b-button>
        </b-button-group>
        <b-card-text class="mt-4" v-if="provider.description">
          <Description :description="provider.description" :compact="true" />
        </b-card-text>
        <Metadata class="mt-4" :data="provider" :ignoreFields="ignore" title="" type="Provider" />
      </b-card-body>
    </b-collapse>
  </b-card>
</template>

<script>
import { BCollapse, BIconChevronRight, BIconChevronDown } from 'bootstrap-vue';
import Description from './Description.vue';
import Metadata from './Metadata.vue';

export default {
  name: 'Provider',
  components: {
    BCollapse,
    BIconChevronDown,
    BIconChevronRight,
    Description,
    Metadata
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
}
</script>

<style lang="scss">
.provider {
  .btn-provider {
    text-align: left;

    .badge {
      text-transform: uppercase;
    }
  }
  .metadata {
    h4 {
      font-size: 1.2rem;
    }
    .card-columns {
      column-count: 1;
    }
    .card-body {
      padding: 0;
    }
    &:only-child:empty {
      display: inline !important;
      &:before {
        content: 'No additional information available.';
      }
    }
  }
}
</style>