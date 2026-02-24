import CodeGenerator from './CodeGenerator.js';

export default class RustGenerator extends CodeGenerator {
  static get label() {
    return 'Rust';
  }

  static get language() {
    return 'rust';
  }

  generate() {
    const searchUrl = this.catalogHref.replace(/\/?$/, '/search');
    const lines = [
      'use reqwest;',
      'use serde_json::json;',
      '',
      '#[tokio::main]',
      'async fn main() -> Result<(), Box<dyn std::error::Error>> {',
      '    let client = reqwest::Client::new();',
      ''
    ];

    if (this.hasFilters()) {
      lines.push('    // Search parameters');
      const jsonLines = JSON.stringify(this.filters, null, 4)
        .split('\n')
        .map((line, i) => i === 0 ? `    let params = json!(${line}` : `    ${line}`)
        .join('\n');
      lines.push(jsonLines + ');');
    }
    else {
      lines.push('    let params = json!({});');
    }

    lines.push('');
    lines.push(`    let response = client.post("${searchUrl}")`);
    lines.push('        .json(&params)');
    lines.push('        .send()');
    lines.push('        .await?;');
    lines.push('');
    lines.push('    let body = response.text().await?;');
    lines.push('    println!("{}", body);');
    lines.push('');
    lines.push('    Ok(())');
    lines.push('}');

    return lines.join('\n');
  }
}
