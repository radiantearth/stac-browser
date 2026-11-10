# Cal-Adapt STAC Browser

A customized [STAC Browser](https://github.com/radiantearth/stac-browser) for the [Cal-Adapt STAC API](https://stac.cal-adapt.org), live at https://stac-browser.cal-adapt.org.

Based on [radiantearth/stac-browser](https://github.com/radiantearth/stac-browser) v5.1.0. See upstream's [README](https://github.com/radiantearth/stac-browser/blob/v5.1.0/README.md) and [docs](https://github.com/radiantearth/stac-browser/tree/v5.1.0/docs) for everything not covered here.

## Cal-Adapt customizations

Custom code lives in `src/caladapt/` and is wired in through STAC Browser's config files, so upstream files stay unchanged where possible.

- **Config** (`config.js`): Cal-Adapt API and title (also shown on the home page instead of the API's own title), the Cal-Adapt bear logo (`public/bear.png`), hash routing so existing `/#/` links keep working, footer links, English and light mode only, no favorites or social sharing, and `collectionOrder`, the collections listed first on the home page and in the All datasets sidebar.
- **Brand theme**: Cal-Adapt colors, Poppins and Roboto fonts, navy text, and a pale blue header in `src/theme/variables.scss`; small overrides in `src/theme/custom.scss`, including a left-aligned header title, hover outlines on collection and item tiles, and hidden Search, API, Share and Additional filters buttons.
- **Home page filters**: keyword pill buttons under the search box (`src/components/Catalogs.vue`), and Browse, relabelled "All datasets" (`src/locales/en/custom.json`), beside Source.
- **Widgets** (`widgets.config.js`): a Dataset Overview on collection pages with tables built from `caladapt:*_labels` fields and queryable values (labels in `src/caladapt/collectionOverviewConfig.js`).
- **Asset actions** (`assetActions.config.js`): Preview for CSV files, and Download for public `s3://` files over HTTPS.
- **Python snippets**: climakitae or xarray/pandas code on each asset (`src/caladapt/PythonSnippet.vue`).
- **Hidden metadata** (`fields.config.js`): fields that the Dataset Overview already shows.

Edits to upstream files, to check when upgrading:

- `src/components/AssetAlternative.vue`: renders the Python snippet.
- `src/views/Catalog.vue`: adds the `view-catalog-intro-end` widget hook.
- `src/StacBrowser.vue`: adds the Browse button (labelled "All datasets" in `src/locales/en/custom.json`) beside Source in the page title row.
- `src/components/Catalogs.vue`: shows the keyword filter as toggle pill buttons under the search box, matching collections with any selected keyword. Upstream shows a multi-select dropdown that requires every keyword, and only when the API has no free-text collection search. Also drops the ascending/descending sort buttons, and puts the collections in the `collectionOrder` config option first (`src/caladapt/collectionOrder.js`).
- `src/components/Tree.vue`: puts the `collectionOrder` collections first in the All datasets sidebar too.

`src/theme/custom.scss` also targets upstream class names and IDs in the header (`.navigation` and the order of its buttons, with Browse first, `.title`, `#popover-share-btn`, `#popover-link-btn`) and on the home page (`.additional-filter-link`). If an upgrade renames them, hidden buttons come back or the layout shifts, so check the header and home page after upgrading.

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
