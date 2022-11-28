<template>
  <div class="auth">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body header="Authentication">
        <b-card-body>
          <p>
            The requested page requires authentication.
            Please provide your authentication details in the text field below.
          </p>
          <Description v-if="authConfig.description" :description="authConfig.description" />
          <b-form-input class="mb-2 mt-2" type="password" v-model.trim="token" autofocus required />
        </b-card-body>
        <b-card-footer>
          <b-button type="submit" variant="primary">Submit</b-button>
          <b-button type="reset" variant="danger" class="ml-3">Cancel</b-button>
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
      token: ''
    };
  },
  computed: {
    ...mapState(['authConfig'])
  },
  methods: {
    reset() {
      this.$store.commit('requestAuth', null);
    },
    async submit() {
      let value = this.token;
      let key = this.authConfig.key;
      if (typeof this.authConfig.formatter === 'function') {
        value = this.authConfig.formatter(value);
      }
      if (this.authConfig.type === 'query') {
        this.$store.commit('setQueryParameter', {type: 'private', key, value});
      }
      else if (this.authConfig.type === 'header') {
        this.$store.commit('setRequestHeader', {key, value});
      }
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