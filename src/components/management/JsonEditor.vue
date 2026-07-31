<template>
  <CodeMirror class="json-editor" :model-value="modelValue" v-bind="editorSettings" @update:model-value="$emit('update:modelValue', $event)" />
</template>

<script>
import { defineComponent } from 'vue';
import CodeMirror from 'vue-codemirror6';
import { keymap } from '@codemirror/view';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { linter, lintGutter } from '@codemirror/lint';
import { json } from '@codemirror/lang-json';
import { parseWithPointers, resolveRange } from './jsonPositions';

const MAX_DIAGNOSTICS = 100;
// Debounce for the (potentially heavy) validation while typing, in milliseconds
const VALIDATION_DELAY = 1000;

export default defineComponent({
  name: 'JsonEditor',
  components: {
    CodeMirror
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    // Async function that receives the parsed JSON and returns issues:
    // Array of { pointer, message, severity?, keyword?, params? }
    validator: {
      type: Function,
      default: null
    }
  },
  emits: ['update:modelValue', 'request-save'],
  computed: {
    jsonLanguageExtension() {
      return json();
    },
    saveKeymap() {
      return {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          if (!this.readOnly) {
            this.$emit('request-save');
          }
          return true;
        }
      };
    },
    editorSettings() {
      const lintExtension = linter(
        (view) => this.computeDiagnostics(view),
        this.validator ? { delay: VALIDATION_DELAY } : {}
      );
      return {
        basic: true,
        wrap: true,
        readonly: this.readOnly,
        tabSize: 2,
        extensions: [
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, this.saveKeymap]),
          highlightSelectionMatches(),
          lintGutter(),
          lintExtension,
          this.jsonLanguageExtension
        ]
      };
    }
  },
  methods: {
    async computeDiagnostics(view) {
      const syntaxDiagnostics = this.parseDiagnostics(this.jsonLanguageExtension, view);
      if (syntaxDiagnostics.length > 0 || !this.validator || this.readOnly) {
        return syntaxDiagnostics;
      }
      return await this.validationDiagnostics(view);
    },
    // Validate through the provided validator and map the reported JSON pointers
    // to text ranges. Stale results for outdated documents are discarded by the
    // lint plugin itself.
    async validationDiagnostics(view) {
      const doc = view.state.doc;
      let parsed;
      try {
        parsed = parseWithPointers(doc.toString());
      } catch {
        return []; // Syntax errors are reported by parseDiagnostics
      }
      let issues;
      try {
        issues = await this.validator(parsed.data);
      } catch (error) {
        console.error(error);
        return [];
      }
      if (!Array.isArray(issues)) {
        return [];
      }
      return issues.slice(0, MAX_DIAGNOSTICS).map(issue => {
        const { from, to } = resolveRange(parsed.pointers, doc, issue);
        return {
          from,
          to,
          severity: issue.severity || 'error',
          message: issue.message
        };
      });
    },
    parseDiagnostics(languageSupport, view, { message = 'Syntax error' } = {}) {
      const parser = languageSupport?.language?.parser;
      if (!parser) {
        return [];
      }
      const tree = parser.parse(view.state.doc.toString());
      const cursor = tree.cursor();
      const diagnostics = [];
      do {
        if (cursor.type?.isError) {
          const from = cursor.from;
          const to = Math.max(from + 1, cursor.to);
          diagnostics.push({
            from,
            to,
            severity: 'error',
            message
          });
          if (diagnostics.length >= MAX_DIAGNOSTICS) {
            break;
          }
        }
      } while (cursor.next());
      return diagnostics;
    }
  }
});
</script>

<style lang="scss" scoped>
.json-editor {
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  overflow: hidden;
}

:deep(.cm-editor) {
  height: 60vh;
  min-height: 20rem;
}

:deep(.cm-scroller) {
  font-family: var(--bs-font-monospace);
}
</style>
