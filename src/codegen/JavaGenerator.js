import CodeGenerator from './CodeGenerator.js';

export default class JavaGenerator extends CodeGenerator {
  static get label() {
    return 'Java';
  }

  static get language() {
    return 'java';
  }

  generate() {
    const searchUrl = this.catalogHref.replace(/\/?$/, '/search');
    const lines = [
      'import java.net.URI;',
      'import java.net.http.HttpClient;',
      'import java.net.http.HttpRequest;',
      'import java.net.http.HttpResponse;',
      '',
      'HttpClient client = HttpClient.newHttpClient();',
      ''
    ];

    let body = '"{}"';
    if (this.hasFilters()) {
      lines.push('// Search parameters');
      // Escape the JSON for Java string
      const jsonStr = JSON.stringify(this.filters).replace(/"/g, '\\"');
      body = `"${jsonStr}"`;
    }

    lines.push('HttpRequest request = HttpRequest.newBuilder()');
    lines.push(`    .uri(URI.create("${searchUrl}"))`);
    lines.push('    .header("Content-Type", "application/json")');
    lines.push(`    .POST(HttpRequest.BodyPublishers.ofString(${body}))`);
    lines.push('    .build();');
    lines.push('');
    lines.push('HttpResponse<String> response = client.send(');
    lines.push('    request, HttpResponse.BodyHandlers.ofString()');
    lines.push(');');
    lines.push('');
    lines.push('System.out.println(response.body());');

    return lines.join('\n');
  }
}
