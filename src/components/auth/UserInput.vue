<template>
  <div v-if="actions.length > 0" class="auth">
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
import Description from '../Description.vue';
import { BForm, BFormInput } from 'bootstrap-vue';
import { mapActions, mapMutations, mapState } from 'vuex';

export default {
  name: 'UserInput',
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
    ...mapState(['authConfig']),
    ...mapState('auth', ['actions', 'credentials']),
    description() {
      if (this.authConfig.description) {
        return this.authConfig.description;
      }
      return this.$t('authConfig.description');
    }
  },
  created() {
    if (this.auth) {
      this.token = this.credentials;
      this.required = false;
    }
  },
  methods: {
    ...mapMutations('auth', ['resetActions', 'resetCredentials', 'setCredentials']),
    ...mapActions('auth', ['authenticate']),
    reset() {
      this.resetCredentials(null);
      this.resetActions();
    },
    async submit() {
      this.setCredentials(this.token);
      await this.authenticate();
      this.resetActions();
    }
  }
};
</script>

<style lang="scss">
@import '../../theme/variables.scss';

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