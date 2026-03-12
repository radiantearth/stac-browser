# Widgets <!-- omit in toc -->

STAC Browser has a pluggable widget system that lets you inject custom Vue components
into specific locations on the page. Widgets can display pretty much any
content you need - using either the pre-defined widgets or your own Vue components.

- [User Guide](#user-guide)
  - [Configuration File](#configuration-file)
  - [Using Pre-defined Widgets](#using-pre-defined-widgets)
  - [Using Custom Components](#using-custom-components)
- [Pre-defined Widgets](#pre-defined-widgets)
  - [AlertBox](#alertbox)
  - [CustomText](#customtext)
- [Hooks](#hooks)
  - [views/ApiSearch.vue](#viewsapisearchvue)
  - [views/Catalog.vue](#viewscatalogvue)
  - [views/Item.vue](#viewsitemvue)
  - [views/SelectDataSource.vue](#viewsselectdatasourcevue)
- [Developer Guide](#developer-guide)
  - [Creating a New Widget](#creating-a-new-widget)
  - [Adding a New Hook](#adding-a-new-hook)

## User Guide

### Configuration File

Widgets are configured in [`widgets.config.js`](../widgets.config.js) at the project root.
The file exports an object where each key is a **hook ID** (the location on the page, see [below](#hooks))
and each value is an **array of widget definitions** to render at that location.

Multiple widgets can be added to the same hook — they render in array order.

After editing the file, restart or rebuild STAC Browser for changes to take effect.

### Using Pre-defined Widgets

For pre-defined widgets (located in [`src/widgets`](../src/widgets)), specify the `id`
(filename without the `.vue` extension) and any `props`:

```js
{
  id: 'AlertBox',
  props: {
    title: 'Warning',
    text: 'This catalog is currently under maintenance.'
  }
}
```

### Using Custom Components

To use a component from outside `src/widgets/`, import it with Vue's `defineAsyncComponent`
and assign it to the `component` property:

```js
{
  id: 'MyCustomWidget',
  component: defineAsyncComponent(() => import('../MyCustomWidget.vue')),
  props: {
    myOption: true
  }
}
```

Make sure the beginning of the config file includes:

```js
import { defineAsyncComponent } from 'vue';
```

## Pre-defined Widgets

All pre-defined widgets are stored in [`src/widgets`](../src/widgets).

### AlertBox

Renders a dismissible alert banner.

| Props         | Type    | Default     | Description |
| ------------- | ------- | ----------- | ----------- |
| `title`       | String  | `''`        | Bold heading shown before the text. |
| `text`        | String  | `''`        | The alert message body. |
| `variant`     | String  | `'warning'` | Color variant: `'warning'`, `'danger'`, `'success'`, `'info'`, etc. |
| `dismissible` | Boolean | `false`     | Whether the user can close the alert. |

### CustomText

Renders a simple text with a heading.

| Props   | Type   | Default | Description |
| ------- | ------ | ------- | ----------- |
| `title` | String | `''`    | Rendered as an `<h3>` heading. |
| `text`  | String | `''`    | Rendered as a `<p>` paragraph. |

## Hooks

Hooks are named insertion points in the STAC Browser UI where widgets get rendered.
Each hook has an ID like `view-catalog-meta-start` that you use as the key in
`widgets.config.js`.

<!-- START HOOKS -->

### views/ApiSearch.vue

- `view-search-filters-collections-end`
- `view-search-filters-collections-start`
- `view-search-filters-end`
- `view-search-filters-items-end`
- `view-search-filters-items-start`
- `view-search-filters-start`
- `view-search-results-start`

### views/Catalog.vue

- `view-catalog-catalogs-end`
- `view-catalog-catalogs-start`
- `view-catalog-items-end`
- `view-catalog-items-start`
- `view-catalog-meta-end`
- `view-catalog-meta-start`

### views/Item.vue

- `view-item-primary-end`
- `view-item-primary-start`
- `view-item-secondary-end`
- `view-item-secondary-start`

### views/SelectDataSource.vue

- `view-select-data-source-start`
<!-- END HOOKS -->

*Note: This list is auto-generated. Run `npm run docs:hooks` to update it after adding new hooks.*

## Developer Guide

### Creating a New Widget

A widget is a standard Vue single-file component (`.vue` file). To create one:

1. **Create the component file** in `src/widgets/` or at another location of your choice.
   The filename (without extension) must match the component's `name` property exactly (case-sensitive).

   For example, `src/widgets/BannerImage.vue`:

   ```vue
   <template>
     <div class="banner-image">
       <img :src="url" :alt="alt" />
     </div>
   </template>

   <script>
   export default {
     name: "BannerImage",
     props: {
       url: {
         type: String,
         required: true
       },
       alt: {
         type: String,
         default: ''
       }
     }
   };
   </script>

   <style lang="scss" scoped>
   @import "../theme/variables.scss";

   .banner-image {
     margin-bottom: $block-margin;

     img {
       max-width: 100%;
     }
   }
   </style>
   ```

2. **Register it in `widgets.config.js`** under the desired hook:

   ```js
   export default {
     'view-catalog-meta-start': [
       {
         id: 'BannerImage',
         props: {
           url: '/banner.jpg',
           alt: 'Catalog banner'
         }
       },
     ],
   };
   ```

3. **Rebuild** STAC Browser. The widget will be dynamically imported when the hook renders.

**Tips:**

- Use `@import "../theme/variables.scss"` to access shared SCSS variables like `$block-margin`.
- Widgets only receive the `props` defined in `widgets.config.js` — they do not
  automatically receive page data such as the STAC object or items.
  You can import them from the Vuex store.
- You can place the same widget at multiple hooks with different props.

### Adding a New Hook

To add a new widget insertion point to a view:

1. **Add a `<WidgetHook>` tag** in the Vue template of the relevant view or component:

   ```vue
   <WidgetHook id="view-catalog-custom-start" />
   ```

   `WidgetHook` is registered as a global component, so no import is needed.

2. **Update the docs** by running:

   ```bash
   npm run docs:hooks
   ```

   This scans all `.vue` files for `<WidgetHook>` tags and updates the hook list
   in this document automatically.
