<template>
  <div class="codebox">
    <p v-if="generator.installDependencies">
      {{ $t('exampleCode.installDependencies') }}
      <code>{{ generator.installDependencies }}</code>
      <CopyButton :copyText="generator.installDependencies" size="sm" />
    </p>
    <p>
      {{ $t('exampleCode.storeAs') }}
      <code>{{ file }}</code>
      <CopyButton :copyText="file" size="sm" />
    </p>
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
p {
  margin: 0 0 0.5rem;
}
</style>
