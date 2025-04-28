<template>
  <div id="stac-browser-auth-modal">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body :header="t('authentication.title')">
        <b-card-body>
          <p>{{ t('authentication.description') }}</p>
          <Description v-if="promptText" :description="promptText" />
          <b-form-group :label="t('authentication.user')" label-for="basicUser">
            <b-form-input id="basicUser" type="text" v-model.trim="username" autofocus :required="required" />
          </b-form-group>
          <b-form-group :label="t('authentication.password')" label-for="basicPassword">
            <b-form-input id="basicPassword" type="password" v-model.trim="password" :required="required" />
          </b-form-group>
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
import { BForm, BFormInput, BFormGroup } from 'bootstrap-vue';
import i18n from '../../i18n';
import Utils from '../../utils';
import { mapGetters } from 'vuex';

export default {
  name: 'Basic',
  components: {
    BForm,
    BFormInput,
    BFormGroup,
    Description
  },
  props: {
    description: {
      type: String,
      default: null
    },
    credentials: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      username: '',
      password: '',
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
  created() {
    if (this.isLoggedIn) {
      this.$emit('submit', null);
    }
    if (Utils.hasText(this.credentials) && this.credentials.includes(':')) {
      let parts = this.credentials.split(':', 2);
      this.username = parts[0];
      this.password = parts[1];
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
      this.$emit('submit', `${this.username}:${this.password}`);
    }
  }
};
</script>
