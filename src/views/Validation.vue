<template>
  <main class="validation d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>{{ $t('errors.noExternalAccess') }}</b-alert>
    <ErrorAlert v-else-if="error" :url="url" :description="errorDescription" :id="errorId" />
    <ErrorAlert v-else-if="internalError" :url="url" :description="internalError.message" />
    <Loading v-else-if="loading || working" stretch />
    <section v-else-if="report">
      <h2>{{ $t('source.validationReport.title') }}</h2>
      <b-alert variant="info" show>{{ $t('source.validationReport.disclaimer') }}</b-alert>
      <b-row class="stac-id">
        <b-col cols="4">{{ $t('source.id') }}</b-col>
        <b-col>
          <code>{{ report.id }}</code>
        </b-col>
      </b-row>
      <b-row class="result">
        <b-col cols="4">{{ $t('source.validationReport.result') }}</b-col>
        <b-col>
          <span class="text-success" v-if="report.valid">{{ $t('source.valid') }}</span>
          <span class="text-danger" v-else>{{ $t('source.invalid') }}</span>
        </b-col>
      </b-row>

      <hr class="my-4">

      <b-card-group class="results" columns>
        <ValidationResult
          id="core" :errors="report.results.core" :warnings="report.messages"
          :locale="locale" :context="report"
        />
        <ValidationResult
          v-for="(errors, key) in report.results.extensions" :key="key"
          :id="key" :errors="errors" :locale="locale" :context="report"
        />
      </b-card-group>
    </section>
    <ErrorAlert v-else :description="$t('errors.default')" />
  </main>
</template>

<script>
import { mapState } from 'vuex';
import validateSTAC from 'stac-node-validator';
import BrowseMixin from './BrowseMixin.js';
import STAC from '../models/stac.js';
import ValidationResult from '../components/ValidationResult.vue';

export default {
  name: "Validation",
  components: {
    ValidationResult
  },
  mixins: [
    BrowseMixin
  ],
  props: {
    path: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      working: true,
      report: null,
      internalError: null,
      locale: null
    };
  },
  computed: {
    ...mapState(["data", "uiLanguage"]),
    variant() {
      return this.report && this.report.valid ? "success" : "danger";
    }
  },
  watch: {
    data: {
      immediate: true,
      async handler() {
        await this.validate();
      }
    },
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        const i18nFn = (await import(`../locales/${locale}/validation.js`)).default;
        if (i18nFn instanceof Promise) {
          this.locale = (await i18nFn).default;
        }
        else {
          this.locale = i18nFn;
        }
      }
    }
  },
  methods: {
    async validate() {
      this.working = true;
      this.report = null;
      if (this.data instanceof STAC) {
        try {
          this.report = await validateSTAC(this.data);
        } catch (error) {
          this.internalError = error;
        } finally {
          this.working = false;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.report {
  font-weight: bold;
}
</style>

<style lang="scss">
@import '~bootstrap/scss/mixins';
@import "../theme/variables.scss";

#stac-browser .validation .results.card-columns {
  @include media-breakpoint-up(sm) {
    column-count: 2;
  }
  @include media-breakpoint-up(lg) {
    column-count: 3;
  }
  @include media-breakpoint-up(xxxl) {
    column-count: 4;
  }
}
</style>
