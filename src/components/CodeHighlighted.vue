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
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import CopyButton from './CopyButton.vue';
import { mapState } from 'vuex';

let highlighter = null;

function getHighlighter() {
  if (!highlighter) {
    highlighter = createHighlighterCore({
      themes: [
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark')
      ],
      langs: [],
      engine: createJavaScriptRegexEngine()
    });
  }
  return highlighter;
}

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
    languageLoader: {
      type: Function,
      default: null
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
  computed: {
    ...mapState(['colorMode']),
  },
  watch: {
    code: {
      immediate: true,
      handler() {
        this.renderCode();
      }
    },
    languageLoader() {
      this.renderCode();
    }
  },
  methods: {
    async renderCode() {
      const grammarPromise = this.languageLoader?.();
      if (!grammarPromise) {
        this.highlightedCode = '';
        return;
      }
      try {
        const [shiki, { default: grammar }] = await Promise.all([getHighlighter(), grammarPromise]);
        await shiki.loadLanguage(grammar);
        // Embedded grammars come first, the main grammar is the last one
        this.highlightedCode = shiki.codeToHtml(this.code, {
          lang: grammar[grammar.length - 1].name,
          theme: 'github-' + this.colorMode
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
      a.download = this.file || 'code.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
});
</script>

<style lang="scss" scoped>
@import '../theme/variables.scss';

.code {
  position: relative;
  border: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  background: var(--bs-light);

  :deep(pre) {
    margin: 0;
    padding: 0 !important;
    background: transparent !important;
    overflow: visible !important;
  }
  :deep(code) {
    padding: 0;
    font-size: $font-size-sm;
  }

  .code-scroll {
    padding: var(--sb-code-padding);
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
    top: var(--sb-code-padding);
    right: var(--sb-code-padding);
    display: flex;
    gap: calc(var(--sb-code-padding) / 2);
    flex-direction: column;
  }
}
</style>
