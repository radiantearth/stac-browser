<template>
  <div id="stac-browser-auth-modal">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body :header="t('authentication.title')">
        <b-card-body>
          <p>{{ t('authentication.description') }}</p>
          <Description v-if="promptText" :description="promptText" />
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
import { mapGetters } from 'vuex';

export default {
  name: 'ApiKey',
  components: {
    BForm,
    BFormInput,
    Description
  },
  props: {
    description: {
      type: String,
      default: null
    },
    credentials: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      token: '',
      required: true
    };
  },
  computed: {
    ...mapGetters('auth', ['isLoggedIn']),
    promptText() {
      if (this.description) {
        return this.description;
      }
      return this.t('authConfig.description');
    }
  },
  beforeCreate() {
    if (this.isLoggedIn) {
      this.$emit('submit', null);
    }
  },
  created() {
    if (this.credentials) {
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
