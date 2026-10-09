# Web Component <!-- omit in toc -->

STAC Browser can be embedded into any web page as a [web component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).
It works with plain HTML and with any framework.

```html
<stac-browser url="https://example.com/catalog.json"></stac-browser>
<script type="module" src="/path/to/stac-browser.js"></script>
```

- [Build and deploy](#build-and-deploy)
- [Configuration](#configuration)
  - [Attributes](#attributes)
  - [Config property](#config-property)
  - [Changing options](#changing-options)
- [Events](#events)
- [Methods](#methods)
  - [navigate(to)](#navigateto)
  - [navigateToStac(url)](#navigatetostacurl)
  - [setData(data, url)](#setdatadata-url)
- [Properties](#properties)
- [Widgets](#widgets)
- [Metadata and maps](#metadata-and-maps)
  - [Custom fields](#custom-fields)
  - [Hiding fields](#hiding-fields)
  - [Basemaps](#basemaps)
- [Differences to the standalone version](#differences-to-the-standalone-version)
  - [Authentication](#authentication)
- [Layout](#layout)
  - [inline](#inline)
  - [isolated](#isolated)
- [Styling](#styling)
  - [Colors](#colors)
  - [Light and dark mode](#light-and-dark-mode)
- [Limitations](#limitations)

## Build and deploy

Build the web component with the following command:

```bash
npm run build:web-component
```

The files are written to the `dist/` folder:

- `stac-browser.js`: The main file. It registers the `<stac-browser>` element when it is loaded.
- `stac-browser.css`: The styles of the component.
- Several other JavaScript files, e.g. for routes, languages and components that are loaded on demand.

Copy all files from the `dist/` folder to your web server.
On your page, only include `stac-browser.js` as shown above.
The browser loads the CSS and the other files automatically from the same folder.

> [!IMPORTANT]
> Don't add a `<link>` for `stac-browser.css` to your page.
> The component loads the styles itself.
> If you link it on your page, the Bootstrap styles would also apply to your page.

A working example can be found in [`src/web-component.html`](../src/web-component.html).

## Configuration

### Attributes

All [options](options.md) with a single value (a string, number or boolean) can be set as attributes on the element.
The name of the attribute is the name of the option in kebab-case, e.g. `card-view-mode` for `cardViewMode`.
The only exception is `catalogUrl`, which is set through the `url` attribute.

```html
<stac-browser
  url="https://example.com/catalog.json"
  catalog-title="My Catalog"
  card-view-mode="list"
  items-per-page="24"
  show-favorites="false"
></stac-browser>
```

The values are converted to the type of the option:

- Booleans: `true` or `false`.
  An empty value is `true`, like for other HTML attributes, e.g. `<stac-browser display-geo-tiff-by-default>`.
- Numbers: e.g. `24`.
  They must be within the allowed range of the option, e.g. at least `1` for `items-per-page`.
- Options that can be `null`: an empty value sets them to `null`, e.g. `catalog-title=""`.

Invalid values, e.g. `card-view-mode="grid"`, are ignored with a warning in the browser console.
The default value is used instead.

Options with lists, objects or functions can't be set as attributes.
Use the [`config` property](#config-property) for them.

Additionally, there's the `isolation` attribute, which is not an option of STAC Browser.
It can be `inline` (default) or `isolated`, see [Layout](#layout).

Please note that `locale` is only the default language.
If the user selected a language before, or the language of the browser is supported, that language is used instead.
To always use the given language, set [`detectLocaleFromBrowser`](options.md#detectlocalefrombrowser) and [`storeLocale`](options.md#storelocale) to `false`.

### Config property

All [options](options.md) can be set through the `config` property of the element.
This includes lists, objects and functions, e.g. `supportedLocales` or `getMapSourceOptions`.

Set `config` before you add the element to the page.
Most options are only read when STAC Browser starts, see [Changing options](#changing-options).

```js
const el = document.createElement('stac-browser');
el.config = {
  catalogUrl: 'https://example.com/catalog.json',
  supportedLocales: ['en', 'de'],
  requestHeaders: { 'X-Api-Key': 'abc' }
};
document.body.appendChild(el);
```

The options are combined in the following order, later ones override earlier ones:

1. The [default configuration](../config.js), with `historyMode` set to `memory`
2. The attributes
3. The `config` property

If an option is set in the `config` property, changes to the attribute of the same option are ignored.

If you set `config` again, the given options are added to the ones you set before.
Reading `config` returns the options you set through the property, but not the attributes and defaults.

### Changing options

STAC Browser starts when the element is added to the page.
Most options are only read at that moment.

Afterwards, only the following options can be changed:

| Option              | Attribute             |
| ------------------- | --------------------- |
| `catalogTitle`      | `catalog-title`       |
| `locale`            | `locale`              |
| `cardViewMode`      | `card-view-mode`      |
| `enforcedColorMode` | `enforced-color-mode` |

You can change them through the attribute or the `config` property.
If you remove the attribute, the default value is used again.
The [CSS variables](#colors) can be changed at any time, too.

```js
el.setAttribute('catalog-title', 'My Catalog');
el.config = { cardViewMode: 'list' };
```

Changes to all other options are ignored while STAC Browser is running.
This includes `catalogUrl` (the `url` attribute) and `historyMode` (the `history-mode` attribute).
To apply them, remove the element from the page and add it again.
The element keeps its attributes and its `config`, so STAC Browser restarts with the new options.
You can also replace the element with a new one.

```js
el.setAttribute('url', 'https://example.com/other/catalog.json');
const parent = el.parentNode;
el.remove();
parent.appendChild(el);
```

> [!NOTE]
> A restart resets STAC Browser, e.g. it goes back to the start page.
> This also happens if you move the element to another place in your page.

## Events

The element emits events so that your page can react to changes in STAC Browser.
All events are [`CustomEvent`s](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
They bubble and can be caught outside of the element.
The event data is available in `event.detail`.

| Event            | `detail`                      | Emitted when...                                         |
| ---------------- | ----------------------------- | ------------------------------------------------------- |
| `navigate`       | `{ path, url, title }`        | the user navigates to another page.                     |
| `data`           | `{ url, data }`               | the shown STAC entity changes. `data` is the STAC JSON. |
| `title`          | The page title (string)       | the page title changes.                                 |
| `description`    | A summary (string) or `null`  | the page description changes.                           |
| `locale`         | The language code (string)    | the language of the interface changes.                  |
| `structuredData` | A schema.org object or `null` | the structured data (JSON-LD) changes.                  |
| `error`          | The error                     | an error is shown.                                      |

Example:

```js
el.addEventListener('navigate', (event) => {
  console.log('Now showing', event.detail.url);
});
```

Please note:

- `navigate` is emitted when the page changes, but the data may still be loading.
  Use the `data` event if you need the data.
- The `url` is `null` for pages that don't show a STAC entity, e.g. the search page (`/search`).

The standalone STAC Browser updates the head of the page (title, `<meta>` tags, JSON-LD) itself.
The web component doesn't do that, as the head belongs to your page.
If you want to update it, use the events `title`, `description`, `locale` and `structuredData`.

## Methods

You can call the methods right after creating the element.
If STAC Browser hasn't finished starting yet, the call is executed once it has.
All methods return a Promise.
The Promise is rejected if STAC Browser fails to start, or if the element is removed from the page before it is ready.

### navigate(to)

Opens a page in STAC Browser.
`to` is either a path or a location object of the router (e.g. `{ name, params }`).

```js
el.navigate('/'); // Start page
el.navigate('/search'); // Search page
```

### navigateToStac(url)

Opens the STAC Catalog, Collection or Item at the given URL.

```js
el.navigateToStac('https://example.com/collections/foo');
```

URLs outside of the configured catalog only work if [`allowExternalAccess`](options.md#allowexternalaccess) is enabled.

### setData(data, url)

Shows your own STAC data as if it was loaded from the given URL.
`data` must be an object, not a JSON string.

```js
el.setData(collectionJson, 'https://example.com/collections/draft');
```

The data is migrated to the latest STAC version.
Relative links are resolved against `url`, so users can continue browsing from there.

If you call `setData` again with the same URL, the view is updated.
This is useful for a live preview in an editor, for example.

## Properties

The element has two properties to get the content that is currently shown:

- `url`: The URL of the STAC entity, or `null`.
  Please note that the `url` attribute doesn't change, it always contains the initial URL.
- `data`: The STAC JSON of the entity (migrated to the latest STAC version), or `null` while it is loading.
  This is a copy, so changing it doesn't change what STAC Browser shows.

Alternatively, you can listen to the `data` event, which is emitted whenever the shown entity changes:

```js
el.addEventListener('data', (event) => {
  console.log(event.detail.url, event.detail.data?.extent?.spatial?.bbox);
});
```

## Widgets

You can show your own content at the [widget hooks](widgets.md#hooks) of STAC Browser.
Add it as a child of the element and set the `slot` attribute to the ID of the hook:

```html
<stac-browser url="https://example.com/catalog.json">
  <div slot="view-catalog-meta-start">Shown above the description of a catalog</div>
</stac-browser>
```

The content can be anything that can be placed in your page: plain HTML, other web components, or components of your framework (e.g. Vue or React).
It is shown whenever the current page has the hook, and hidden otherwise.

Please note:

- The content stays part of your page, so it is styled by the CSS of your page, not by STAC Browser.
- It doesn't have access to STAC Browser internals.
  Use the [events](#events) or [properties](#properties) to get the data that is shown, e.g. to show something only for Items.
- You can add multiple elements for the same hook, they are shown in the order of your page.
- If you use Vue, tell it that `stac-browser` is a custom element ([`compilerOptions.isCustomElement`](https://vuejs.org/api/application.html#app-config-compileroptions-iscustomelement)).
  A Vue component with a `slot` attribute needs a single root element, which then receives the attribute.

Widgets configured in [`widgets.config.js`](widgets.md) are shown before your content.

## Metadata and maps

### Custom fields

STAC Browser uses [stac-fields](https://github.com/stac-utils/stac-fields) to show the metadata.
To show your own fields, register them in the `Registry` of stac-fields, which you can import from the module of the web component.
Use the same URL as for the `<script>` tag, so that you get the instance that STAC Browser uses:

```js
import { Registry } from '/path/to/stac-browser.js';

Registry.addExtension('radiant', 'Radiant Earth');
Registry.addMetadataField('radiant:public_access', {
  label: 'Data Access',
  formatter: (value) => (value ? 'Public' : 'Private')
});
```

Register the fields before you add the element to the page.
The registry is shared by all elements on the page.
See [Adding custom fields](metadata.md#adding-custom-fields) for details.

### Hiding fields

To hide fields in the metadata, set the [`ignoreMetadata`](options.md#ignoremetadata) option through the `config` property:

```js
el.config = {
  ignoreMetadata: (object, fields, type) => type === 'Item' ? [...fields, 'created', 'updated'] : fields
};
```

See [Hiding fields](metadata.md#hiding-fields) for details.

### Basemaps

To show your own basemaps, set the [`basemaps`](options.md#basemaps) option through the `config` property.
To change the map sources further, e.g. to add an API key, use [`getMapSourceOptions`](options.md#getmapsourceoptions).
See the [basemap documentation](basemaps.md) for details.

## Differences to the standalone version

The web component behaves slightly different than the standalone STAC Browser, so that it doesn't interfere with your page:

- The URL in the address bar of the browser doesn't change.
  STAC Browser uses the [`memory` history mode](options.md#memory) by default.
  If you want the URL to change, set the `history-mode` attribute to `hash` or `history`.
- The title of the page (`document.title`) doesn't change.
  You can use the `title` event to set it yourself.
- STAC Browser never prevents users from leaving your page.
  There's no warning about running downloads,
  and the editor doesn't ask about unsaved changes (they are still kept as drafts).

These differences are always active in the web component and can't be configured.

### Authentication

OpenID Connect (`openIdConnect`) only works if `history-mode` is set to `history`.
The reason is that the identity provider needs to redirect users back to a real URL after login.
Your server must also serve the `/auth` callback routes of STAC Browser.

HTTP Basic and API keys work with all history modes.

## Layout

The `isolation` attribute defines how the element fits into your page.

### inline

This is the default.

- The element grows with its content and your page scrolls as usual.
- Dialogs and the sidebar can cover the whole page.
- The element uses the background, text color and fonts of your page, so that it blends in.
- The element doesn't need a specific size.

### isolated

The element works similar to an `<iframe>`.

- The element has its own scrollbar.
- Dialogs and the sidebar stay within the element. Your page can still be scrolled while they are open.
- The element uses its own background, text color and fonts, like the standalone STAC Browser.
- The element needs a fixed height, e.g. set via CSS or as a flex/grid item.
  Otherwise it has a height of zero and you won't see anything.

```html
<stac-browser url="..." isolation="isolated" style="height: 600px"></stac-browser>
```

Set the `isolation` attribute before the element is added to the page.
If you change it later, some parts (e.g. the sticky header) don't adapt to the new mode.
To switch the mode, restart STAC Browser as described in [Changing options](#changing-options).

## Styling

The web component uses a [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM).
This means that the CSS of your page doesn't apply to STAC Browser,
and the CSS of STAC Browser (including Bootstrap) doesn't apply to your page.
This also applies to popovers, tooltips, dropdowns, dialogs and the sidebar.

The only exception are the background, text color and fonts in the [`inline` mode](#inline).
They are taken from your page on purpose.

### Colors

To change the colors, set the Bootstrap CSS variables in the `style` of the element.
They are passed on to STAC Browser and can be changed at any time.

```js
el.style.setProperty('--bs-primary', '#7c3aed');
el.style.setProperty('--bs-primary-rgb', '124, 58, 237');
```

You can also set them in the `style` attribute in HTML:

```html
<stac-browser url="..." style="--bs-primary: #7c3aed; --bs-primary-rgb: 124, 58, 237"></stac-browser>
```

Please note that CSS variables set in your stylesheets, e.g. `stac-browser { --bs-primary: #7c3aed; }`, don't work.
STAC Browser overrides them with its own theme.

The header uses the primary color by default.
To set the colors of the header separately, use `--sb-header` for the background and `--sb-header-color` for the text and links.

See the [styling documentation](styling.md#available-css-variables) for more CSS variables.

### Light and dark mode

Use the [`enforcedColorMode`](options.md#enforcedcolormode) option to choose between light and dark mode.
It only applies to STAC Browser, not to your page.

## Limitations

- Only one STAC Browser per page is supported.
  Multiple instances with different languages would conflict with each other, because they share some translations.
