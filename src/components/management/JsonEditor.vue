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

const MAX_DIAGNOSTICS = 100;

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
      const lintExtension = linter((view) => this.parseDiagnostics(this.jsonLanguageExtension, view));
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
