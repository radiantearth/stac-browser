<template>
  <main class="validation d-flex flex-column">
    <b-alert v-if="!allowExternalAccess && isExternal" show>{{ $t('errors.noExternalAccess') }}</b-alert>
    <ErrorAlert v-else-if="error" :url="url" :description="errorDescription" :id="errorId" />
    <ErrorAlert v-else-if="internalError" :url="url" :description="internalError.message" />
    <Loading v-else-if="loading || working" stretch />
    <section v-else-if="report">
      <h2>{{ $t('source.validationReport.title') }}</h2>
      <b-row class="result">
        <b-col cols="4">{{ $t('source.validationReport.result') }}</b-col>
        <b-col class="text-bold">
          <span class="text-success" v-if="report.valid">{{ $t('source.valid') }}</span>
          <span class="text-danger" v-else>{{ $t('source.invalid') }}</span>
        </b-col>
      </b-row>
      <b-row class="stac-id">
        <b-col cols="4">{{ $t('source.id') }}</b-col>
        <b-col>
          <code>{{ report.id }}</code>
        </b-col>
      </b-row>

      <ul v-if="report.messages.length > 0">
        <li v-for="message in report.messages" :key="message">{{ message }}</li>
      </ul>

      <hr class="my-4">

      <b-card-group class="results" columns>
        <ValidationResult id="core" :errors="report.results.core" :context="report" />
        <ValidationResult v-for="(errors, key) in report.results.extensions" :key="key" :id="key" :errors="errors" :context="report" />
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
      internalError: null
    };
  },
  computed: {
    ...mapState(["data"]),
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
