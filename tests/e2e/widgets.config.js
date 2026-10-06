/**
 * Widget configuration for the e2e tests, used instead of widgets.config.js (see vite.config.js).
 *
 * The widgets are only shown if a test enables their hook, e.g.:
 *   await page.addInitScript(() => { window.E2E_WIDGET_HOOKS = ['frontpage-start']; });
 */
import widgets from '../../widgets.config.js';

const FEATURED_HOOKS = ['root-before-content', 'view-catalog-catalogs-start', 'frontpage-start'];

const config = Object.assign({}, widgets);
for (const hook of FEATURED_HOOKS) {
  config[hook] = (config[hook] || []).concat([{
    id: 'Featured',
    condition: () => Array.isArray(window.E2E_WIDGET_HOOKS) && window.E2E_WIDGET_HOOKS.includes(hook),
    props: {
      entities: ['products/collection.json'],
      title: `Featured in ${hook}`
    }
  }]);
}

export default config;
