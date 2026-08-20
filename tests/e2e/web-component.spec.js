/**
 * `<stac-browser>` web component.
 *
 * Loads a minimal host page (src/web-component.html) that embeds the custom element and
 * verifies the embedding contract: the browser renders inside the element, the
 * host page is left intact, configuration via attribute works, navigation stays
 * in memory (address bar untouched), and the `navigate` event fires.
 */
import { test, expect } from './fixtures.js';
import { mockStacResource, openSourcePanel } from './helpers.js';
import StaticCatalog from '../fixtures/instances/static.js';

// In CI the app is served from the production build (vite preview), where the
// dev-only src path isn't emitted; build-wc-host.mjs emits an equivalent host
// at /web-component.html that loads the built element bundle. Locally the dev
// server serves the source demo directly.
const HOST_PATH = process.env.CI ? '/web-component.html' : '/src/web-component.html';

test.describe('<stac-browser> web component', () => {
  const catalogUrl = 'https://stac.example/wc/catalog.json';
  const catalogTitle = 'Web Component Catalog';

  test.beforeEach(async ({ worker }) => {
    await mockStacResource(worker, 'https://stacindex.org/api/catalogs', []);
  });

  async function embed(page, worker) {
    const mockCatalog = new StaticCatalog({ url: catalogUrl })
      .setMetadata({ title: catalogTitle, description: 'Mock catalog for the web component.' });
    await mockCatalog.createServer(worker, { reset: false });
    // The element's events are bubbling and composed, so capture them at the
    // document level (the demo page itself does not expose any test hooks).
    await page.addInitScript(() => {
      window.__events = { navigate: [], title: [], description: [], locale: [], structuredData: [] };
      for (const type of Object.keys(window.__events)) {
        document.addEventListener(type, (e) => window.__events[type].push(e.detail));
      }
    });
    await page.goto(`${HOST_PATH}?url=${encodeURIComponent(catalogUrl)}`);
  }

  test('renders the browser inside the element and keeps the host page intact', async ({ page, worker }) => {
    await embed(page, worker);

    // The host page's own chrome (the URL bar) is untouched.
    await expect(page.locator('header input#url')).toBeVisible();

    // The app is mounted inside the custom element.
    await expect(page.locator('stac-browser #stac-browser')).toBeVisible();

    // Configuration via the `url` attribute took effect: the catalog is shown.
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();
  });

  test('routes in memory without touching the host address bar', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // The host page URL never changed to a STAC Browser path.
    expect(new URL(page.url()).pathname).toBe(HOST_PATH);
  });

  test('emits a navigate event the host page can observe', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    await expect.poll(
      () => page.evaluate(() => window.__events.navigate.length)
    ).toBeGreaterThan(0);
    // The most recent navigate event resolves back to the catalog URL.
    const last = await page.evaluate(() => window.__events.navigate.at(-1));
    expect(last.url).toContain('stac.example/wc/catalog.json');
  });

  test('renders inside a shadow root with its styles applied there', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    const info = await page.locator('stac-browser').evaluate((el) => {
      const root = el.shadowRoot;
      const app = root && root.querySelector('#stac-browser');
      return {
        hasShadow: Boolean(root),
        appInShadow: Boolean(app),
        appInLight: Boolean(el.querySelector('#stac-browser')),
        // #stac-browser is `display: flex` via the app styles; if those styles
        // were not present inside the shadow root it would fall back to block.
        display: app ? getComputedStyle(app).display : null
      };
    });
    expect(info.hasShadow).toBe(true);
    expect(info.appInShadow).toBe(true);
    expect(info.appInLight).toBe(false);
    expect(info.display).toBe('flex');
  });

  test('does not leak host page styles into the shadow root', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // The demo page styles `header { display: flex }`; regular properties never
    // cross the shadow boundary, so that must not reach STAC Browser's own
    // <header> inside the shadow root, regardless of the isolation mode.
    const display = await page.locator('stac-browser').evaluate((el) => {
      const header = el.shadowRoot.querySelector('#stac-browser > header');
      return header ? getComputedStyle(header).display : null;
    });
    expect(display).not.toBe('flex');
  });

  test('does not leak component styles into the host page', async ({ page, worker }) => {
    // Only holds for the built bundle: the dev server injects module CSS into
    // the host head (and the spec mirrors it into the shadow root).
    test.skip(!process.env.CI, 'dev-only style injection leaks by design');
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // A Bootstrap-classed probe in the host must not pick up component styles.
    const probe = await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      document.body.appendChild(btn);
      const cs = getComputedStyle(btn);
      const result = { color: cs.color, borderRadius: cs.borderRadius };
      btn.remove();
      return result;
    });
    expect(probe.color).not.toBe('rgb(255, 255, 255)');
    expect(probe.borderRadius).toBe('0px');
  });

  test('themes the shadow root live, not the host document, without reloading', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Mark the current instance to detect whether toggling dark recreates it.
    await page.locator('stac-browser').evaluate((el) => { el.dataset.instance = 'first'; });
    await page.locator('#dark').check();

    const theme = await page.locator('stac-browser').evaluate((el) => {
      const root = el.shadowRoot.querySelector('.stac-browser-root');
      return {
        sameInstance: el.dataset.instance === 'first',
        container: root?.dataset.bsTheme,
        hostBody: document.body.getAttribute('data-bs-theme'),
        hostHtml: document.documentElement.getAttribute('data-bs-theme')
      };
    });
    expect(theme.sameInstance).toBe(true);
    expect(theme.container).toBe('dark');
    expect(theme.hostBody).toBeNull();
    expect(theme.hostHtml).toBeNull();
  });

  test('applies a primary theme color set on the element through the shadow boundary', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Pick a new primary color in the demo; the component forwards custom
    // properties set on the element into the shadow container.
    await page.locator('#primary').evaluate((el) => {
      el.value = '#ff0000';
      el.dispatchEvent(new Event('input'));
    });

    const colors = await page.locator('stac-browser').evaluate((el) => {
      const app = el.shadowRoot.querySelector('#stac-browser');
      const site = el.shadowRoot.querySelector('#stac-browser > header .site');
      return {
        primary: getComputedStyle(app).getPropertyValue('--bs-primary').trim(),
        // The site header derives from --sb-header, which follows --bs-primary.
        header: getComputedStyle(site).getPropertyValue('--sb-header').trim()
      };
    });
    expect(colors.primary).toBe('#ff0000');
    expect(colors.header).toBe('#ff0000');
  });

  test('lets a host --sb-* override win over the component defaults', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // A direct --sb-header override (not via --bs-primary) must beat the shadow
    // default; it would lose if the default were attached to #stac-browser.
    await page.locator('stac-browser').evaluate((el) => {
      el.style.setProperty('--sb-header', '#123456');
    });
    const header = await page.locator('stac-browser').evaluate((el) => {
      const site = el.shadowRoot.querySelector('#stac-browser > header .site');
      return getComputedStyle(site).getPropertyValue('--sb-header').trim();
    });
    expect(header).toBe('#123456');
  });

  test('applies a config-driven option (catalog title) live, without reloading', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Mark the instance, then override the title via a sidebar config control.
    await page.locator('stac-browser').evaluate((el) => { el.dataset.instance = 'first'; });
    await page.locator('#title').fill('Demo Override');

    const state = await page.locator('stac-browser').evaluate((el) => ({
      sameInstance: el.dataset.instance === 'first',
      headerTitle: el.shadowRoot.querySelector('.header-title [role="banner"]')?.textContent?.trim()
    }));
    expect(state.sameInstance).toBe(true);
    expect(state.headerTitle).toBe('Demo Override');
  });

  test('isolated mode contains fixed overlays within the component box', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Probe how a position: fixed child (like a modal/backdrop) is sized: append
    // one into the app and measure it against the element box and the viewport.
    const probe = () => page.locator('stac-browser').evaluate((el) => {
      const elRect = el.getBoundingClientRect();
      const app = el.shadowRoot.querySelector('#stac-browser');
      const measure = (css, className) => {
        const d = document.createElement('div');
        d.style.cssText = css;
        if (className) d.className = className;
        app.appendChild(d);
        const r = d.getBoundingClientRect();
        d.remove();
        return r.width;
      };
      return {
        elW: elRect.width,
        fixedW: measure('position:fixed;inset:0;'),
        backdropW: measure('position:fixed;top:0;left:0;', 'modal-backdrop'),
        viewportW: window.innerWidth
      };
    });

    // Inline (default): a fixed child spans the whole viewport, not the element.
    const inline = await probe();
    expect(inline.elW).toBeLessThan(inline.viewportW);
    expect(Math.round(inline.fixedW)).toBe(Math.round(inline.viewportW));

    // Isolated: the same fixed child (and a viewport-unit backdrop) is contained
    // to the component's box, well short of the viewport.
    await page.selectOption('#isolation', 'isolated');
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();
    const isolated = await probe();
    expect(isolated.fixedW).toBeLessThan(isolated.viewportW - 50);
    expect(Math.abs(isolated.fixedW - isolated.elW)).toBeLessThan(Math.abs(isolated.fixedW - isolated.viewportW));
    expect(isolated.backdropW).toBeLessThan(isolated.viewportW - 50);
  });

  test('inline inherits host styling, isolated applies its own', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Poison the host body's typography and background.
    await page.evaluate(() => {
      document.body.style.fontFamily = 'Comic Sans MS';
      document.body.style.backgroundColor = 'rgb(1, 2, 3)';
    });
    const read = () => page.locator('stac-browser').evaluate((el) => {
      const root = el.shadowRoot.querySelector('.stac-browser-root');
      const app = el.shadowRoot.querySelector('#stac-browser');
      return { font: getComputedStyle(app).fontFamily, rootBg: getComputedStyle(root).backgroundColor };
    });

    // Inline (default): inherits the host font; the root paints no background.
    const inline = await read();
    expect(inline.font).toMatch(/Comic Sans/);
    expect(inline.rootBg).toBe('rgba(0, 0, 0, 0)');

    // Isolated: re-applies its own reboot, independent of the host.
    await page.selectOption('#isolation', 'isolated');
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();
    const isolated = await read();
    expect(isolated.font).not.toMatch(/Comic Sans/);
    expect(isolated.rootBg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('opens a popover teleported inside the shadow root', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Open the source popover (exercises the element-ref target + teleport that
    // the shadow DOM requires; a string target/#stac-browser selector would fail
    // because it resolves against `document`, not the shadow root).
    const panel = await openSourcePanel(page);
    await expect(panel).toBeVisible();

    // The popover was teleported into the shadow root, not the host light DOM.
    const location = await page.locator('stac-browser').evaluate((el) => ({
      inShadow: Boolean(el.shadowRoot.querySelector('#popover-link')),
      inLightDom: Boolean(el.querySelector('#popover-link'))
    }));
    expect(location.inShadow).toBe(true);
    expect(location.inLightDom).toBe(false);
  });

  test('emits page-metadata events for the host to consume', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Title and locale events arrive with the current values.
    await expect.poll(() => page.evaluate(() => window.__events.title.at(-1) || '')).toContain(catalogTitle);
    const meta = await page.evaluate(() => ({
      locale: window.__events.locale,
      lastSchema: window.__events.structuredData.at(-1)
    }));
    expect(meta.locale).toContain('en');
    // The structured-data event carries the schema.org JSON-LD object.
    expect(meta.lastSchema && meta.lastSchema['@type']).toBeTruthy();

    // The demo host reacts to the `title` event by setting its document title.
    await expect(page).toHaveTitle(new RegExp(catalogTitle, 'i'));
  });

  test('exposes a navigate() method for the host page', async ({ page, worker }) => {
    await embed(page, worker);
    await expect(page.getByRole('heading', { name: new RegExp(catalogTitle, 'i') })).toBeVisible();

    // Driving navigation from the host works and does not throw.
    const ok = await page.evaluate(async () => {
      await document.querySelector('stac-browser').navigate('/');
      return true;
    });
    expect(ok).toBe(true);
  });
});
