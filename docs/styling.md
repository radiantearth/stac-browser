# Styling & Theming <!-- omit in toc -->

STAC Browser supports **build-time** styling  only. You can edit Sass variables before running `npm run build`. Full control over every aspect of the theme, including fonts, spacing, breakpoints, and colors.

Both light and dark mode are supported. The dark-mode toggle is shown in the header unless you enforce a specific mode via the [`enforcedColorMode`](./options.md) config option.

All theme files live in the [`src/theme/`](../src/theme/) folder and are Sass files (a CSS preprocessor). The easiest starting point is `variables.scss`, which exposes the most common options.
For a full list of what Bootstrap itself exposes, see:

- [Bootstrap Colors](https://getbootstrap.com/docs/5.3/customize/color/)
- [Bootstrap Options](https://getbootstrap.com/docs/5.3/customize/options/)

The file `page.scss` contains SCSS declarations for the main layout sections of STAC Browser and can be adapted to suit your needs.

For even deeper changes you will need to edit the Vue components directly.

## Table of contents <!-- omit in toc -->

- [Build-time customization](#build-time-customization)
  - [General variables (both modes)](#general-variables-both-modes)
  - [Light mode](#light-mode)
  - [Dark mode (Sass variables)](#dark-mode-sass-variables)
  - [Custom CSS](#custom-css)

---

## Build-time customization

All build-time theme files live in [`src/theme/`](../src/theme/).

| File             | Purpose |
| ---------------- | ------- |
| `variables.scss` | Sass variable overrides — the main theming file |
| `custom.scss`    | Custom CSS/SCSS for your deployment |

Ideally, don't change the `page.scss` and `datepicker.scss` files.
Try to override the styles in `custom.scss` to avoid conflicts when updating STAC Browser.

### General variables (both modes)

The **GENERAL** section of `variables.scss` contains color-neutral settings that apply regardless of the active color mode: spacing, typography, breakpoints, border radius, and STAC Browser-specific variables.

### Light mode

The **LIGHT MODE** section sets colors for light mode.
These Sass variables are resolved at compile time.

Bootstrap derives many secondary values (subtle backgrounds, border colors, text-emphasis variants) automatically from these variables.

For the full list of overridable Bootstrap Sass variables see  
<https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss>

### Dark mode (Sass variables)

The **DARK MODE** section in `variables.scss` sets the `-dark`-suffixed Bootstrap Sass variables. These control body background/text and link colors for `[data-bs-theme="dark"]`.

For the full list of available `-dark` variables see  
<https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables-dark.scss>

The number of customizations is reduced compared to light mode.
This is a bootstrap limitation.
You can only work around it by overriding the Bootstrap CSS variables using the
`[data-bs-theme="dark"]` CSS selector.

`$primary`, `$secondary` etc. are **shared** between light and dark mode at the Sass level — there are no `$primary-dark` equivalents. Bootstrap automatically derives dark-mode tints and shades from the shared palette.

If you need a completely different palette in dark mode, override Bootstrap's CSS custom properties in `custom.scss`:

```scss
[data-bs-theme="dark"] {
  --bs-primary: #4db8c4;
  --bs-primary-rgb: 77, 184, 196;   // must match the hex value above
  --bs-secondary: #9ba5ad;
  --bs-secondary-rgb: 155, 165, 173;
  // … other colors as needed
}
```

> [!IMPORTANT]  
> Whenever you set `--bs-*`, always update the matching `--bs-*-rgb` as well.
> Bootstrap uses the RGB form for `rgba()` opacity variants internally.
> Use any hex-to-RGB converter, e.g. <https://www.rapidtables.com/convert/color/hex-to-rgb.html>

### Custom CSS

Any change that cannot be expressed as a variable override goes in `custom.scss`.

This file will never change in our source code repository so it's the safest place to make changes without running into conflicts when updating STAC Browser.
