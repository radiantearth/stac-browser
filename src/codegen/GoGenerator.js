import CodeGenerator from './CodeGenerator.js';
import template from './templates/go.go?raw';

export default class GoGenerator extends CodeGenerator {
  get language() {
    return 'go';
  }

  get outputFile() {
    return 'search.go';
  }

  get template() {
    return template;
  }

  get indent() {
    return 2;
  }

  get commentChars() {
    return '///';
  }

  renderBody(body) {
    return this.toGoLiteral(body, 2);
  }

  toGoLiteral(value, depth) {
    const pad = '\t'.repeat(depth);
    const closePad = '\t'.repeat(depth - 1);

    if (value === null || typeof value === 'undefined') {
      return 'nil';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]any{}';
      }
      // Keep arrays of scalars on one line; expand only when they nest.
      const scalar = value.every(v => v === null || typeof v !== 'object');
      if (scalar) {
        return `[]any{${value.map(v => this.toGoLiteral(v, depth)).join(', ')}}`;
      }
      const items = value.map(v => `${pad}${this.toGoLiteral(v, depth + 1)},`);
      return `[]any{\n${items.join('\n')}\n${closePad}}`;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return 'map[string]any{}';
      }
      const items = keys.map(
        k => `${pad}${this.goString(k)}: ${this.toGoLiteral(value[k], depth + 1)},`
      );
      return `map[string]any{\n${items.join('\n')}\n${closePad}}`;
    }
    if (typeof value === 'string') {
      return this.goString(value);
    }
    // number / boolean
    return String(value);
  }

  /**
   * Render a string as a Go interpreted string literal, mirroring the escaping
   * of Go's strconv.Quote: backslash and double quote, the named escapes, and
   * \xHH for every other ASCII control character (< 0x20 and DEL 0x7F). Leaving
   * raw control characters in the source would be invalid or silently alter the
   * string's meaning. Printable and multi-byte UTF-8 characters pass through.
   */
  goString(s) {
    const named = {
      '\x07': '\\a',
      '\b': '\\b',
      '\f': '\\f',
      '\n': '\\n',
      '\r': '\\r',
      '\t': '\\t',
      '\v': '\\v',
    };
    let out = '"';
    for (const ch of s) {
      const code = ch.codePointAt(0);
      if (ch === '\\' || ch === '"') {
        out += '\\' + ch;
      }
      else if (named[ch]) {
        out += named[ch];
      }
      else if (code < 0x20 || code === 0x7f) {
        out += '\\x' + code.toString(16).padStart(2, '0');
      }
      else {
        out += ch;
      }
    }
    return out + '"';
  }

}
