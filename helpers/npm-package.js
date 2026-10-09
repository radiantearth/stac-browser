import fs from 'fs';
import path from 'path';
import process from 'process';

// Turns the web component build in dist/ into an npm package.
// Run `npm run build:npm`, which builds the web component first.

const distDir = 'dist';
const repoUrl = 'https://github.com/radiantearth/stac-browser';

if (!fs.existsSync(path.join(distDir, 'stac-browser.js'))) {
  console.error('dist/stac-browser.js is missing, run `npm run build:web-component` first.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const tag = `v${pkg.version}`;

const manifest = {
  name: pkg.name,
  version: pkg.version,
  description: 'STAC Browser as a web component (<stac-browser>) to embed it into any web page.',
  keywords: ['stac', 'stac-browser', 'web-component', 'custom-element', 'geospatial', 'earth-observation'],
  type: 'module',
  main: './stac-browser.js',
  module: './stac-browser.js',
  exports: {
    '.': './stac-browser.js',
    './stac-browser.css': './stac-browser.css',
    './package.json': './package.json'
  },
  // Importing the module registers the <stac-browser> element.
  sideEffects: true,
  license: pkg.license,
  author: pkg.author,
  contributors: pkg.contributors,
  homepage: `${repoUrl}/blob/${tag}/docs/web-component.md`,
  repository: pkg.repository,
  bugs: pkg.bugs,
  funding: pkg.funding
};
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');

// The docs link to other files in the repository, which are not part of the package.
const readme = fs.readFileSync('docs/web-component.md', 'utf-8')
  .replace(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (match, target) => {
    const [file, anchor] = target.split('#');
    const url = `${repoUrl}/blob/${tag}/${path.posix.normalize(path.posix.join('docs', file))}`;
    return `](${url}${anchor ? `#${anchor}` : ''})`;
  });
fs.writeFileSync(path.join(distDir, 'README.md'), readme);

fs.copyFileSync('LICENSE', path.join(distDir, 'LICENSE'));

console.log(`Prepared ${manifest.name}@${manifest.version} in ${distDir}/`);
