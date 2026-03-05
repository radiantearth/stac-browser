<template>
  <div class="code">
    <CopyButton
      class="copy"
      :copyText="code"
      :button-props="{ 'aria-label': $t('exampleCode.copyExampleCode') }"
    />
    <div v-if="highlightedCode" v-html="highlightedCode" />
    <pre v-else><code>{{ code }}</code></pre>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { codeToHtml } from 'shiki';
import CopyButton from './CopyButton.vue';

export default defineComponent({
  name: 'CodeHighlighted',
  components: {
    CopyButton
  },
  props: {
    code: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      highlightedCode: ''
    };
  },
  watch: {
    code: {
      immediate: true,
      handler() {
        this.renderCode();
      }
    },
    language() {
      this.renderCode();
    }
  },
  methods: {
    async renderCode() {
      try {
        this.highlightedCode = await codeToHtml(this.code, {
          lang: this.language,
          theme: 'github-light'
        });
      }
      catch {
        this.highlightedCode = '';
      }
    }
  }
});
</script>

<style scoped>
.code {
  position: relative;
  padding: 1rem;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-light);
  overflow: auto;
}
.copy {
  position: absolute;
  top: 1rem;
  right: 1rem;
}
.code :deep(pre) {
  margin: 0;
  padding: 0 !important;
  background: transparent !important;
  overflow: visible !important;
}
.code :deep(code) {
  padding: 0;
  font-size: 0.875rem;
}
</style>
