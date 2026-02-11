<template>
  <div id="stac-browser-auth-modal">
    <b-form @submit.stop.prevent="submit" @reset="reset">
      <b-card no-body :header="$t('authentication.title')">
        <b-card-body>
          <p>{{ $t('authentication.description') }}</p>
          <Description v-if="promptText" :description="promptText" />
          <b-form-group label-cols="auto" :label="$t('authentication.user')" label-for="basicUser">
            <b-form-input autofocus id="basicUser" type="text" v-model.trim="username" :required="required" />
          </b-form-group>
          <b-form-group label-cols="auto" :label="$t('authentication.password')" label-for="basicPassword">
            <b-form-input id="basicPassword" type="password" v-model.trim="password" :required="required" />
          </b-form-group>
        </b-card-body>
        <b-card-footer>
          <b-button type="submit" variant="primary">{{ $t('submit') }}</b-button>
          <b-button type="reset" variant="danger" class="ms-3">{{ $t('cancel') }}</b-button>
        </b-card-footer>
      </b-card>
    </b-form>
  </div>
</template>

<script>
import Description from '../Description.vue';
import Utils from '../../utils';
import { mapGetters } from 'vuex';
import { BCard, BCardBody, BCardFooter } from 'bootstrap-vue-next';

export default {
  name: 'Basic',
  components: {
    BCard,
    BCardBody,
    BCardFooter,
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
  emits: ['submit', 'reset'],
  data() {
    return {
      username: '',
      password: '',
      required: true,
      validate: false
    };
  },
  computed: {
    ...mapGetters('auth', ['isLoggedIn']),
    promptText() {
      if (this.description) {
        return this.description;
      }
      return this.$t('authConfig.description');
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
    reset() {
      this.$emit('reset');
    },
    async submit() {
      this.validate = true;
      this.$emit('submit', `${this.username}:${this.password}`);
    }
  }
};
</script>
