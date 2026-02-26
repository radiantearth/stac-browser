import CodeGenerator from './CodeGenerator.js';

export default class CSharpGenerator extends CodeGenerator {
  static get label() {
    return 'C#';
  }

  static get language() {
    return 'csharp';
  }

  generate() {
    const searchUrl = this.catalogHref.replace(/\/?$/, '/search');
    const lines = [
      'using System.Net.Http;',
      'using System.Text;',
      '',
      'var httpClient = new HttpClient();',
      ''
    ];

    if (this.hasFilters()) {
      lines.push('// Search parameters');
      lines.push('var json = """');
      const jsonLines = JSON.stringify(this.filters, null, 4).split('\n');
      for (const jsonLine of jsonLines) {
        lines.push(`    ${jsonLine}`);
      }
      lines.push('    """;');
      lines.push('');
      lines.push(`var searchUrl = "${searchUrl}";`);
      lines.push('var content = new StringContent(json, Encoding.UTF8, "application/json");');
    }
    else {
      lines.push(`var searchUrl = "${searchUrl}";`);
      lines.push('var content = new StringContent("{}", Encoding.UTF8, "application/json");');
    }

    lines.push('');
    lines.push('var response = await httpClient.PostAsync(searchUrl, content);');
    lines.push('var responseBody = await response.Content.ReadAsStringAsync();');
    lines.push('');
    lines.push('Console.WriteLine(responseBody);');

    return lines.join('\n');
  }
}
