<template>
  <div class="auth">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body :header="t('authentication.title')">
        <b-card-body>
          <p>{{ t('authentication.description') }}</p>
          <Description v-if="description" :description="description" />
          <b-form-input class="mb-2 mt-2" type="password" v-model.trim="token" autofocus :required="required" />
        </b-card-body>
        <b-card-footer>
          <b-button type="submit" variant="primary">{{ t('submit') }}</b-button>
          <b-button type="reset" variant="danger" class="ml-3">{{ t('cancel') }}</b-button>
        </b-card-footer>
      </b-card>
    </b-form>
  </div>
</template>

<script>
import Description from '../Description.vue';
import { BForm, BFormInput } from 'bootstrap-vue';
import i18n from '../../i18n';

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
  props: {
    config: {
      type: Object,
      default: null
    }
  },
  computed: {
    description() {
      if (this.config?.description) {
        return this.config.description;
      }
      return this.t('authConfig.description');
    }
  },
  created() {
    if (this.auth) {
      this.token = this.credentials;
      this.required = false;
    }
  },
  methods: {
    t(key) {
      return i18n.t(key);
    },
    reset() {
      this.$emit('reset');
    },
    async submit() {
      this.$emit('submit', this.token);
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../../theme/variables.scss';

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
</style>