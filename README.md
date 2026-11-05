# Cal-Adapt STAC Browser

A customized [STAC Browser](https://github.com/radiantearth/stac-browser) for the [Cal-Adapt STAC API](https://stac.cal-adapt.org), live at https://stac-browser.cal-adapt.org.

Based on [radiantearth/stac-browser](https://github.com/radiantearth/stac-browser) v5.1.0. See upstream's [README](https://github.com/radiantearth/stac-browser/blob/v5.1.0/README.md) and [docs](https://github.com/radiantearth/stac-browser/tree/v5.1.0/docs) for everything not covered here.

## Cal-Adapt customizations

Custom code lives in `src/caladapt/` and is wired in through STAC Browser's config files, so upstream files stay unchanged where possible.

- **Config** (`config.js`): Cal-Adapt API and title (also shown on the home page instead of the API's own title), the Cal-Adapt bear logo (`public/bear.png`), hash routing so existing `/#/` links keep working, footer links, English and light mode only, no favorites or social sharing.
- **Brand theme**: Cal-Adapt colors, Poppins and Roboto fonts, and the Cobalt to Ocean header in `src/theme/variables.scss`; small overrides in `src/theme/custom.scss`, including a left-aligned header title and hidden Browse, Search, API and Share buttons.
- **Widgets** (`widgets.config.js`): featured collections on the landing page, and a Dataset Overview on collection pages with tables built from `caladapt:*_labels` fields and queryable values (labels in `src/caladapt/collectionOverviewConfig.js`).
- **Asset actions** (`assetActions.config.js`): Preview for CSV files, and Download for public `s3://` files over HTTPS.
- **Python snippets**: climakitae or xarray/pandas code on each asset (`src/caladapt/PythonSnippet.vue`).
- **Hidden metadata** (`fields.config.js`): fields that the Dataset Overview already shows.

Edits to upstream files, to check when upgrading:

- `src/components/AssetAlternative.vue`: renders the Python snippet.
- `src/views/Catalog.vue`: adds the `view-catalog-intro-end` widget hook.

`src/theme/custom.scss` also targets upstream class names and IDs in the header (`.navigation`, `.title`, `#popover-share-btn`, `#popover-link-btn`). If an upgrade renames them, the header buttons come back or the layout shifts, so check the header after upgrading.

## Local development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm start
```

Browse to http://localhost:8080.

## Deployment

- **Production**: pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy-demo.yml`.
- **Previews**: each pull request is built and deployed to Netlify via `.github/workflows/preview.yml`, which comments the preview link on the PR. Needs the `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` repository secrets.
