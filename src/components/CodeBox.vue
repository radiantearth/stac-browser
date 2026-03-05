<template>
  <div class="codebox">
    <div v-if="generator.installDependencies" class="meta-row">
      <p class="meta-text">
        {{ $t('exampleCode.installDependencies') }}
        <code class="meta-code">{{ generator.installDependencies }}</code>
      </p>
      <CopyButton
        :copyText="generator.installDependencies"
        size="sm"
        :button-props="{ 'aria-label': $t('exampleCode.copyDependencies') }"
      />
    </div>
    <div class="meta-row">
      <p class="meta-text">
        {{ $t('exampleCode.storeAs') }}
        <code class="meta-code">{{ file }}</code>
      </p>
      <CopyButton
        :copyText="file"
        size="sm"
        :button-props="{ 'aria-label': $t('exampleCode.copyOutputFilename') }"
      />
    </div>
    <CodeHighlighted :code="code" :language="language" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import CodeHighlighted from './CodeHighlighted.vue';
import CopyButton from './CopyButton.vue';

export default defineComponent({
  name: 'CodeBox',
  components: {
    CodeHighlighted,
    CopyButton
  },
  props: {
    generator: {
      type: Object,
      required: true
    },
    filters: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      highlightedCode: ''
    };
  },
  computed: {
    code() {
      return this.generator.generate(this.filters);
    },
    language() {
      return this.generator.language;
    },
    file() {
      return this.generator.outputFile;
    }
  }
});
</script>

<style scoped>
.meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
}

.meta-text {
  min-width: 0;
  margin: 0;
}

.meta-code {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
