# Embedding STAC Browser as a Web Component

STAC Browser can be embedded into any web page — regardless of framework — as a
[custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components):

```html
<stac-browser url="https://example.com/catalog.json"></stac-browser>
<script type="module" src="/path/to/stac-browser.js"></script>
```

Load only the module: the component fetches its stylesheet into the shadow root
itself (see [Styling and isolation](#styling-and-isolation)), so you must deploy
`stac-browser.css` next to `stac-browser.js` but must not `<link>` it on the host
page — a host `<link>` would leak Bootstrap's global styles into the host page
and defeat the isolation.

The element renders into a **shadow root**, so its styles are isolated from the
host page and vice versa. It runs STAC Browser in [embedded mode](#embedded-mode):
it routes in-memory (it never changes the host page's address bar) and does not
touch the host page's `document.title` or its unload handling.

- [Building the bundle](#building-the-bundle)
- [Configuration](#configuration)
- [Events](#events)
- [Methods](#methods)
- [Reading the current content](#reading-the-current-content)
- [Embedded mode](#embedded-mode)
- [Isolation modes](#isolation-modes)
- [Styling and isolation](#styling-and-isolation)

## Building the bundle

```bash
npm run build:web-component
```

This produces the custom element and its assets in `dist/`:

- `stac-browser.js` — registers the `<stac-browser>` custom element on import
- `stac-browser.css` — the component's styles, loaded automatically into its
  shadow root (do not link it on the host page, see above)
- additional code-split chunks (routes, locale files, async components)

The build is code-split rather than a single file, so deploy the whole `dist/`
output together and load only the module on your page (see the snippet above);
the browser fetches the CSS and the other chunks itself, relative to the module
URL. A ready-to-run example is in [`web-component.html`](../src/web-component.html).

## Configuration

Common options can be set as **attributes**:

| Attribute       | Config option  | Description                                       |
| --------------- | -------------- | ------------------------------------------------- |
| `url`           | `catalogUrl`   | The STAC catalog or API to show.                  |
| `catalog-title` | `catalogTitle` | A custom title for the catalog.                   |
| `locale`        | `locale`       | The UI language, e.g. `de`.                       |
| `history-mode`  | `historyMode`  | `memory` (default when embedded), `hash`, `history`. |
| `isolation`     | —              | `inline` (default) or `isolated`; see [Isolation modes](#isolation-modes). |

For anything not covered by an attribute — including options that are functions
(e.g. `getMapSourceOptions`) — set the full [config object](options.md) via the
`config` DOM property:

```js
const el = document.querySelector('stac-browser');
el.config = {
  catalogUrl: 'https://example.com/catalog.json',
  cardViewMode: 'list',
  crossOriginMedia: 'anonymous'
};
```

Attributes and the `config` property are merged on top of the
[default configuration](../config.js), with the `config` property taking
precedence. Setting `config` merges into (patches) the current configuration.

Once the element is connected, only these options update the running browser:
`catalogTitle`, `cardViewMode`, `enforcedColorMode` and `locale` (and the
`--bs-*` custom properties). Every other option — including `url`/`catalogUrl`
and `historyMode` — is read once when the element first connects; change it by
re-creating the element.

## Events

The element emits bubbling, composed `CustomEvent`s so the host page can react:

| Event            | `detail`                       | When                                         |
| ---------------- | ------------------------------ | -------------------------------------------- |
| `navigate`       | `{ path, url, title }`         | On every in-app navigation.                  |
| `data`           | `{ url, data }`                | The displayed entity changed; `data` is its STAC JSON (see [Reading the current content](#reading-the-current-content)). |
| `title`          | the document title string      | The page title changed.                      |
| `description`    | a summary string, or `null`    | The page description changed.                |
| `locale`         | the UI language code           | The UI language changed.                     |
| `structuredData` | the schema.org object, or `null` | The structured data (JSON-LD) changed.     |
| `error`          | the global error payload       | When a global error is shown.                |

Note that `navigate` fires when the route changes, while the entity's data may
still be loading; `data` fires once it is available.

```js
el.addEventListener('navigate', (e) => {
  console.log('now showing', e.detail.url);
});
```

The `title` / `description` / `locale` / `structuredData` events exist so the
host page can manage its own document head (tab title, `<meta>` tags, JSON-LD).
This is the same page metadata that the standalone app writes to the document by
default; embedding leaves that to the host instead. The default writer lives
outside the Vue components (`src/document-head.js`, fed by `src/page-metadata.js`),
so the app produces the metadata once and either consumer — the default document
head or these events — reacts to it.

## Methods

All methods can be called right after creating the element; calls made while it
is still initializing are applied once it is ready.

- `navigate(to)` — navigate the embedded browser programmatically, e.g.
  `el.navigate('/')` to go back to the root or `el.navigate('/search')`. Accepts
  anything the router accepts: a browser path or a location object
  (`{ name, params }`). Returns the router's navigation promise.
- `navigateToStac(url)` — navigate to a STAC catalog, collection or item by its
  URL, e.g. `el.navigateToStac('https://example.com/collections/foo')`. URLs
  outside the configured catalog require `allowExternalAccess`. Returns the
  router's navigation promise.
- `setData(data, url)` — show custom STAC data (a plain object, not a JSON
  string) as if it had been loaded from `url`: the data is migrated to the
  latest STAC version, cached under that URL and displayed; relative links
  resolve against it and clicking them browses on as usual. Calling it again
  with the same URL updates the view in place, e.g. for an editor live preview:

  ```js
  el.setData(collectionJson, 'https://example.com/collections/draft');
  ```

## Reading the current content

The element exposes what is currently displayed:

- `el.url` — the URL of the displayed STAC resource, or `null`. (The `url`
  *attribute* is the initially configured catalog and is not updated.)
- `el.data` — the displayed entity's STAC JSON (migrated to the latest STAC
  version) as a plain object, or `null` while loading. It is a copy: changing it
  does not affect the browser.

```js
el.addEventListener('data', (e) => {
  console.log(e.detail.url, e.detail.data?.extent?.spatial?.bbox);
});
```

The `data` event (see [Events](#events)) pushes the same information whenever
the displayed entity changes, including when its data finishes loading after a
`navigate` event.

## Embedded mode

The web component runs STAC Browser in *embedded mode*. This is not a config
option you can set — the wrapper enables it internally (it is derived from the
shadow-root mount target), so it has no effect when set on the standalone app.
In embedded mode STAC Browser:

- routes with `historyMode: 'memory'` by default, so the host page's URL is never
  touched (override with the `history-mode` attribute if you want URL syncing);
- does not set `document.title` (the host page owns the tab title);
- does not install the `beforeunload` download guard (it must not block the host
  page from navigating away).

## Isolation modes

The `isolation` attribute controls how the component coexists with the host page:

- **`inline`** (default) — the element grows with its content and the host page
  scrolls. Overlays (modals, the sidebar) are `position: fixed` and can span the
  whole page, like a normal full-screen dialog. There are no size requirements,
  and the component inherits the host page's background, text color and
  typography so it blends into the surrounding content.
- **`isolated`** — the element behaves like an `<iframe>`: it owns its own scroll
  viewport and establishes a containing block, so overlays are contained within
  the element's box and never cover the host page. It also styles itself (its own
  background, text color and typography) rather than inheriting the host's. This
  requires you to give `<stac-browser>` a **definite height** (e.g. an explicit
  `height` or a flex/grid cell); otherwise it has nothing to scroll in and collapses.

```html
<stac-browser url="…" isolation="isolated" style="height: 600px"></stac-browser>
```

In both modes the styles are isolated in the shadow root (see below); the mode
only changes scrolling and how far overlays reach. Isolation sets up the scroll
viewport when the element connects, so switch it by re-creating the element.

## Styling and isolation

The element renders into a shadow root and injects its stylesheet there, so host
page styles do not affect STAC Browser and STAC Browser's styles (Bootstrap
included) do not leak into the host page. Popovers, tooltips, dropdowns, modals
and the sidebar are teleported inside the shadow root so they stay isolated too.

There is no `<body>` inside the shadow root to carry the base page styles
(background, text color and typography). In [`isolated`](#isolation-modes) mode
the component re-applies them to its root container so it renders the same as the
standalone app; in `inline` mode it deliberately leaves them unset and inherits
them from the host page, to blend in.

To theme the browser, set Bootstrap CSS custom properties on the element — the
component forwards them into the shadow root:

```js
el.style.setProperty('--bs-primary', '#7c3aed');
el.style.setProperty('--bs-primary-rgb', '124, 58, 237');
```

Setting `--bs-primary` also recolors the site header, which follows the primary
color by default. To style the header independently, set `--sb-header` (its
background base color) and `--sb-header-color` (the text and links on it).

Light/dark is controlled by the `enforcedColorMode` config option and applied
only inside the shadow root, not to the host page.

A single instance per page is assumed: two instances with different UI languages
would compete over the shared `stac-fields` translations.
