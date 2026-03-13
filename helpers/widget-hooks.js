import fs from 'fs';
import path from 'path';

const srcDir = 'src';
const docsFile = 'docs/widgets.md';
const hookPattern = /<(?:WidgetHook|widget-hook)\s[\s\S]*?\bid=["']([^"']+)["']/g;

function findVueFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findVueFiles(fullPath));
    } else if (entry.name.endsWith('.vue')) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractHooksByFile(files) {
  const hooksByFile = {};
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    // Only search within <template> blocks
    const templateMatch = content.match(/<template[\s>][\s\S]*?<\/template>/);
    if (!templateMatch) {
      continue;
    }
    const template = templateMatch[0];
    const ids = [];
    let match;
    while ((match = hookPattern.exec(template)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }
    if (ids.length > 0) {
      const relPath = path.relative(srcDir, file).replaceAll('\\', '/');
      hooksByFile[relPath] = ids.sort();
    }
  }
  return hooksByFile;
}

const files = findVueFiles(srcDir);
const hooksByFile = extractHooksByFile(files);
const sortedFiles = Object.keys(hooksByFile).sort();

let total = 0;
console.log('Widget hooks by file:');
for (const file of sortedFiles) {
  console.log(`  ${file}:`);
  for (const id of hooksByFile[file]) {
    console.log(`    - ${id}`);
    total++;
  }
}
console.log(`\nFound ${total} widget hooks in ${sortedFiles.length} files.`);

const markdown = fs.readFileSync(docsFile, 'utf-8');
const lines = [];
for (const file of sortedFiles) {
  lines.push(`\n### ${file}\n`);
  for (const id of hooksByFile[file]) {
    lines.push(`- \`${id}\``);
  }
}
const replacement = lines.join('\n');
const updated = markdown.replace(
  /(<!--\s*START HOOKS\s*-->\n)[\s\S]*?(\n<!--\s*END HOOKS\s*-->)/,
  `$1${replacement}$2`
);

fs.writeFileSync(docsFile, updated, 'utf-8');
console.log(`\nUpdated ${docsFile}`);
