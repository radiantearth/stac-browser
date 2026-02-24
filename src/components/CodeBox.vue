<template>
  <div class="codebox">
    <div v-if="highlightedCode" v-html="highlightedCode" />
    <pre v-else><code>{{ code }}</code></pre>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { codeToHtml } from 'shiki';

export default defineComponent({
  name: 'CodeBox',
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
.codebox {
  border: 1px solid var(--bs-border-color);
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--bs-light);
}
.codebox :deep(pre) {
  margin: 0;
  padding: 0 !important;
  background: transparent !important;
}
.codebox :deep(code) {
  padding: 0;
  font-size: 0.875rem;
}
</style>
