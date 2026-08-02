<template>
  <component :is="activeComponent" v-if="activeComponent" v-bind="activeProps" @submit="submit" @reset="reset" />
  <div v-else-if="chooserSchemes.length > 0" id="stac-browser-auth-modal">
    <b-card no-body :header="$t('authentication.title')">
      <b-card-body>
        <p>{{ $t('authentication.chooseMethod') }}</p>
        <b-list-group>
          <AuthSchemeItem
            v-for="entry in chooserSchemes" :key="entry.id"
            :schemeId="entry.id" :scheme="entry.scheme" @authenticate="choose"
          />
        </b-list-group>
      </b-card-body>
      <b-card-footer>
        <b-button type="reset" variant="danger" @click="reset">{{ $t('cancel') }}</b-button>
      </b-card-footer>
    </b-card>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { defineAsyncComponent } from 'vue';
import { BCard, BCardBody, BCardFooter } from 'bootstrap-vue-next';

export default {
  name: 'Authentication',
  components: {
    ApiKey: defineAsyncComponent(() => import('./auth/ApiKey.vue')),
    Basic: defineAsyncComponent(() => import('./auth/Basic.vue')),
    AuthSchemeItem: defineAsyncComponent(() => import('./AuthSchemeItem.vue')),
    BCard,
    BCardBody,
    BCardFooter
  },
  computed: {
    ...mapGetters('auth', ['activeMethod', 'chooserSchemes']),
    activeComponent() {
      return this.activeMethod ? this.activeMethod.getComponent() : null;
    },
    activeProps() {
      return this.activeMethod ? this.activeMethod.getComponentProps() : {};
    }
  },
  methods: {
    async choose({ id }) {
      await this.$store.dispatch('auth/activateLogin', id);
    },
    async reset() {
      await this.$store.dispatch('auth/abortLogin');
    },
    async submit(credentials) {
      await this.$store.dispatch('auth/finalizeLogin', credentials);
    }
  }
};
</script>
