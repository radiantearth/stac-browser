<template>
  <main class="validation d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>{{ $t('errors.noExternalAccess') }}</b-alert>
    <ErrorAlert v-else-if="error" :url="url" :description="errorDescription" :id="errorId" />
    <ErrorAlert v-else-if="internalError" :url="url" :description="internalError.message" />
    <Loading v-else-if="loading || working" stretch />
    <section v-else-if="report">
      <h2>{{ $t('source.validationReport.title') }}</h2>
      <b-alert variant="warning" show>{{ $t('source.validationReport.disclaimer') }}</b-alert>
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

      <div class="results row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xxxl-4 g-3">
        <div class="col">
          <ValidationResult
            id="core" :errors="report.results.core" :warnings="report.messages"
            :locale="validationLocale" :context="report"
          />
        </div>
        <div
          class="col"
          v-for="(errors, key) in report.results.extensions"
          :key="key"
        >
          <ValidationResult
            :id="key" :errors="errors" :locale="validationLocale" :context="report"
          />
        </div>
      </div>
    </section>
    <ErrorAlert v-else :description="$t('errors.default')" />
  </main>
</template>

<script>
import { mapState } from 'vuex';
import { defineComponent } from 'vue';
import { loadValidationLocale, validateStac } from '../validation';
import BrowseMixin from './BrowseMixin.js';
import { STAC } from 'stac-js';
import ValidationResult from '../components/ValidationResult.vue';

export default defineComponent({
  name: "Validation",
  components: {
    ValidationResult
  },
  mixins: [
    BrowseMixin
  ],
  data() {
    return {
      working: true,
      report: null,
      internalError: null,
      validationLocale: null
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
        this.validationLocale = await loadValidationLocale(locale);
      }
    }
  },
  methods: {
    async validate() {
      this.working = true;
      this.report = null;
      if (this.data instanceof STAC) {
        try {
          const stac = this.data._original || this.data.toJSON();
          this.report = await validateStac(stac);
        } catch (error) {
          this.internalError = error;
        } finally {
          this.working = false;
        }
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.report {
  font-weight: bold;
}
</style>
