import CodeGenerator from './CodeGenerator.js';

export default class JavaScriptGenerator extends CodeGenerator {
  static get label() {
    return 'JavaScript';
  }

  static get language() {
    return 'javascript';
  }

  generate() {
    const searchUrl = this.catalogHref.replace(/\/?$/, '/search');
    const lines = [
      `const searchUrl = "${searchUrl}";`,
      ''
    ];

    if (this.hasFilters()) {
      lines.push('// Search parameters');
      lines.push(`const searchParams = ${this.filtersJson()};`);
      lines.push('');
      lines.push('const response = await fetch(searchUrl, {');
      lines.push('  method: "POST",');
      lines.push('  headers: { "Content-Type": "application/json" },');
      lines.push('  body: JSON.stringify(searchParams)');
      lines.push('});');
    }
    else {
      lines.push('const response = await fetch(searchUrl, {');
      lines.push('  method: "POST",');
      lines.push('  headers: { "Content-Type": "application/json" },');
      lines.push('  body: JSON.stringify({})');
      lines.push('});');
    }

    lines.push('');
    lines.push('const data = await response.json();');
    lines.push('console.log(`Found ${data.features.length} items`);');

    return lines.join('\n');
  }
}
