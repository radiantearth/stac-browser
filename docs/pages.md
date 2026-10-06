# Pages <!-- omit in toc -->

STAC Browser can show additional pages with your own content, e.g. an imprint, a privacy policy or an about page.

- [Defining pages](#defining-pages)
  - [Configuration file](#configuration-file)
  - [`pages` option](#pages-option)
- [Page properties](#page-properties)
- [Content](#content)
  - [Markdown](#markdown)
  - [Widgets](#widgets)
  - [Custom components](#custom-components)
- [Localization](#localization)
- [Conditions](#conditions)
- [Linking to pages](#linking-to-pages)
  - [Header and footer](#header-and-footer)
  - [Markdown](#markdown-1)
  - [Vue components](#vue-components)

## Defining pages

Each page has an ID and is available at `/pages/<id>`, e.g. `/pages/imprint`.

Pages can be defined in two places, which are merged.
If a page with the same ID is defined in both, the page from `pages.config.js` is used.

### Configuration file

Pages are usually configured in [`pages.config.js`](../pages.config.js) at the project root.
The file exports an object with the property `pages`, which maps the page IDs to the page definitions.

```js
import { defineAsyncComponent } from 'vue';

export default {
  pages: {
    imprint: {
      title: { en: 'Imprint', de: 'Impressum' },
      content: {
        en: () => import('./pages/imprint.en.md?raw'),
        de: () => import('./pages/imprint.de.md?raw')
      },
      footer: true
    },
    about: {
      title: 'About',
      description: 'What this catalog is about',
      component: defineAsyncComponent(() => import('./pages/About.vue')),
      menu: true
    }
  }
};
```

After editing the file, restart or rebuild STAC Browser for changes to take effect.

### `pages` option

Pages can also be defined with the [`pages`](options.md#pages) option.
This allows to add pages without changing the build, e.g. through the environment variable `SB_pages` or in the `runtime-config.js`.

Environment variables only support JSON, so the Markdown content must be provided as a string or via `url`:

```bash
SB_pages='{"imprint":{"title":{"en":"Imprint","de":"Impressum"},"url":{"en":"https://example.com/imprint.en.md","de":"https://example.com/imprint.de.md"},"footer":true}}'
```

## Page properties

| Property      | Type                       | Description |
| ------------- | -------------------------- | ----------- |
| `title`       | String \| Object           | The title of the page, shown as heading and in the browser tab. Defaults to the page ID. |
| `description` | String \| Object           | A short description of the page, used for the HTML metadata (e.g. for search engines). |
| `content`     | String \| Function \| Object | Markdown content, see [Markdown](#markdown). |
| `url`         | String \| Object           | URL of a Markdown file, see [Markdown](#markdown). |
| `allowHTML`   | Boolean                    | Allows HTML tags in the Markdown content. Defaults to `false`. |
| `widgets`     | Array                      | A list of widgets, see [Widgets](#widgets). |
| `component`   | Vue component              | A custom Vue component, see [Custom components](#custom-components). |
| `props`       | Object                     | The props for the custom Vue component. |
| `menu`        | Boolean                    | Adds a link to the page to the header. Defaults to `false`. |
| `icon`        | Vue component              | The icon for the link in the header. Defaults to a document icon. |
| `footer`      | Boolean                    | Adds a link to the page to the footer. Defaults to `false`. |
| `condition`   | Function                   | Shows the page only if the function returns `true`, see [Conditions](#conditions). |

Each page should provide one of `content`, `url`, `widgets` or `component`.
If multiple are given, they are used in this order.

Properties that are shown as String \| Object can be localized, see [Localization](#localization).

## Content

### Markdown

The `content` property contains [CommonMark](https://commonmark.org/) (Markdown).
It can be given as a string or as a function that returns a string or a Promise that resolves to a module with the string as default export.
The latter allows to load Markdown files from the project with Vite's `?raw` suffix, e.g. `() => import('./pages/imprint.md?raw')`.
The files are only loaded when the page is shown.

Alternatively, the `url` property can point to a Markdown file, which is loaded when the page is shown.
Relative URLs are resolved against the [`pathPrefix`](options.md#pathprefix).
The server must allow access to the file from STAC Browser, i.e. send CORS headers if it's hosted on another domain.

HTML tags in the Markdown are removed, unless `allowHTML` is set to `true`.

### Widgets

The `widgets` property contains a list of widgets, which are rendered in the given order.
The list uses the same format as in [`widgets.config.js`](widgets.md#configuration-file), including [conditions](widgets.md#conditional-widgets).

```js
about: {
  title: 'About',
  widgets: [
    { id: 'CustomText', props: { title: 'Welcome', text: 'This catalog contains...' } },
    { id: 'AlertBox', props: { text: 'The catalog is updated daily.', variant: 'info' } }
  ]
}
```

### Custom components

The `component` property contains a Vue component, which is rendered as the content of the page.
The props for the component can be given in `props`.

```js
about: {
  title: 'About',
  component: defineAsyncComponent(() => import('./pages/About.vue')),
  props: {
    showLogo: true
  }
}
```

## Localization

The properties `title`, `description`, `content` and `url` can be given as a string, which is used for all languages,
or as an object with a value per language (see [`supportedLocales`](options.md#supportedlocales)):

```js
title: { en: 'Imprint', de: 'Impressum' }
```

STAC Browser uses the value for the current language, then the value for the language without the country (e.g. `de` for `de-CH`),
then the value for the [`fallbackLocale`](options.md#fallbacklocale), and otherwise the first value.

## Conditions

By default, a page is always available. To limit a page to specific situations, add a `condition` function.
The page is only available while the function returns `true`, otherwise it shows an error and isn't linked anywhere.
The function receives an object with the Vuex store `state` and `getters`.

For example, to show a page only to logged in users:

```js
orders: {
  title: 'My orders',
  component: defineAsyncComponent(() => import('./pages/Orders.vue')),
  condition: ({ getters }) => getters['auth/isLoggedIn'],
  menu: true
}
```

Functions are not supported in environment variables.

## Linking to pages

### Header and footer

Set `menu: true` to add a link to the page to the header, and `footer: true` to add a link to the footer.

Pages can also be added to the [`footerLinks`](options.md#footerlinks) option with the `page` property instead of `url`.
This allows to define the order of the links and to use a different label.
If no `label` is given, the title of the page is used.

```js
footerLinks: [
  { page: 'imprint' },
  { page: 'privacy', label: 'Privacy' },
  { label: 'Terms of use', url: 'https://example.com/terms' }
]
```

### Markdown

In Markdown, e.g. in pages or in the [`CustomText`](widgets.md#customtext) widget, link to pages with the `page:` scheme followed by the page ID:

```md
Please read our [privacy policy](page:privacy).
```

### Vue components

In Vue components, e.g. in widgets or custom pages, use the globally available `PageLink` component.
It shows the title of the page, unless content is given:

```vue
<PageLink page="imprint" />
<PageLink page="privacy">our privacy policy</PageLink>
```

The link to a page is also available through the Vuex getter `pageLink`, e.g. `this.$store.getters.pageLink('imprint')`.
Links to unavailable pages are not shown, and `pageLink` returns `null` for them.
