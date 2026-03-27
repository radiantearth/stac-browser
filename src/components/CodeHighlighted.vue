<template>
  <div class="code">
    <div class="actions">
      <b-button
        :title="$t('assets.download.generic')"
        size="sm" variant="primary"
        @click.prevent.stop="download"
      >
        <b-icon-download />
      </b-button>
      <CopyButton
        :copyText="code" size="sm"
        :button-props="{id: 'exampleCodeCopyExampleCode'}"
      />
    </div>
    <div class="code-scroll">
      <div class="code-inner" v-if="highlightedCode" v-html="highlightedCode" />
      <pre class="code-inner" v-else><code>{{ code }}</code></pre>
    </div>
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
    },
    file: {
      type: String,
      default: null
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
    },
    download() {
      const blob = new Blob([this.code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.file || `code.${this.language}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
});
</script>

<style lang="scss" scoped>
.code {
  position: relative;
  border: 1px solid var(--bs-border-color);
  background: var(--bs-light);

  :deep(pre) {
    margin: 0;
    padding: 0 !important;
    background: transparent !important;
    overflow: visible !important;
  }
  :deep(code) {
    padding: 0;
    font-size: 0.875rem;
  }

  .code-scroll {
    padding: 1rem;
    overflow: auto;

    // Make sure we can scroll the full code into view, even if the action buttons may block it
    > * {
      display: inline-block;
      min-width: 100%;
      padding-right: 3rem;
      box-sizing: border-box;
    }
  }

  .actions {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
  }
}
</style>
