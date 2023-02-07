<template>
  <div class="auth">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body :header="$t('authentication.title')">
        <b-card-body>
          <p>{{ $t('authentication.description') }}</p>
          <Description v-if="description" :description="description" />
          <b-form-input class="mb-2 mt-2" type="password" v-model.trim="token" autofocus :required="required" />
        </b-card-body>
        <b-card-footer>
          <b-button type="submit" variant="primary">{{ $t('submit') }}</b-button>
          <b-button type="reset" variant="danger" class="ml-3">{{ $t('cancel') }}</b-button>
        </b-card-footer>
      </b-card>
    </b-form>
  </div>
</template>

<script>
import Description from './Description.vue';
import { BForm, BFormInput } from 'bootstrap-vue';
import { mapState } from 'vuex';

export default {
  name: 'Authentication',
  components: {
    BForm,
    BFormInput,
    Description
  },
  data() {
    return {
      token: '',
      required: true
    };
  },
  computed: {
    ...mapState(['authConfig', 'authData']),
    description() {
      if (this.authConfig.description) {
        return this.authConfig.description;
      }
      return this.$t('authConfig.description');
    }
  },
  created() {
    if (this.authData) {
      this.token = this.authData;
      this.required = false;
    }
  },
  methods: {
    reset() {
      this.$store.commit('requestAuth', null);
    },
    async submit() {
      await this.$store.dispatch('setAuth', this.token);
      await this.$store.dispatch('retryAfterAuth');
      this.$store.commit('requestAuth', null);
    }
  }
};
</script>

<style lang="scss">
@import '../theme/variables.scss';

#stac-browser {
  .auth {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0, 0.5);
    margin: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;

    > form {
      min-width: 200px;
      width: 50vw;
      border-radius: $border-radius;

      > .card {
        background-color: #fff;
      }
    }
  }
}
</style>