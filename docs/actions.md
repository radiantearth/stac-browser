# Actions <!-- omit in toc -->

STAC Browser has a pluggable interface to share or open assets and links with other services, which we call "actions".

An action adds a button to an asset or link if certain requirements are met, which can then be executed by users.
For example, you could open COPC files in a dedicated COPC Viewer, which otherwise you could only download.

- [User Guide](#user-guide)
  - [Assets](#assets)
  - [Links](#links)
- [Developer Guide](#developer-guide)

> [!CAUTION]
> Sinve v5.0.0, the handling of i18n messages has changed.
> You should not import the i18n file anymore to load messages.
> Instead, remove the import and use `this.i18n` instead of the imported `i18n`.

## User Guide

### Assets

The following actions are available:

- `Cesium`: Allows to open OGC 3D Tiles (media type `application/3dtiles+json`) files through the Cesium Sandcastle at <https://sandcastle.cesium.com>.
- `CopcViewer`: Allows to open Cloud-Optimized Point Cloud (COPC, media type `application/vnd.laszip+copc`) files through the Hobu COPC Viewer at <https://viewer.copc.io>.
- `F3D`: Allows to open 3D models (media types `model/gltf-binary`, `model/gltf+json`, and `application/fbx`) files through the F3D Web App at <https://f3d.app/web>.
- `Felt`: Allows to open GeoTIFF, GeoJSON and KML/KMZ files through Felt at <https://felt.com/map/>.
- `Geofox`: Allows to open OGC 3D Tiles  (media type `application/3dtiles+json`) files through the 3D Assets Viewer at <https://viewer.geofox.ai>.
- `GeoJsonIo`: Allows to open GeoJSON files through [geojson.io](https://geojson.io).
- `Potree`: Allows to open Cloud-Optimized Point Cloud (COPC, media type `application/vnd.laszip+copc`) and Potree files (file names `cloud.js`, `metadata.json`, `ept.json`) files through the Potree Viewer at <https://3d.iconem.com/apps/load_potree_project_from_urlparam/>.
- `Protomaps`: Allows to open PMTiles (media type `application/vnd.pmtiles`) files through PMTiles Viewer at <https://pmtiles.io>.

All actions for assets are stored in the folder [`src/actions/assets`](../src/actions/assets) if you want to inspect them.

The actions can be enabled by adding them to the [`assetActions.config.js`](../assetActions.config.js) file.
Open the file and you'll see a number of imports and exports.
Import the file for the action that you want to enable, e.g. for Felt:

```js
import Felt from './src/actions/assets/Felt.js';
```

The path is fixed to `./src/actions/assets/`, the file extension is always `.js`.
In-between add the file name from the list above.
The import name should be the file name without extension (i.e. `Felt` again).

Lastly, add the import name to the list of exports, e.g.

```js
export default {
  OtherAction,
  Felt
};
```

Save the file and restart / rebuild STAC Browser.

### Links

The following actions are available:

- `Cesium`: Allows to open OGC 3D Tiles (relation type `3d-tiles`, see [web-map-links extension](https://github.com/stac-extensions/web-map-links/blob/v1.2.0/README.md#3d-tiles)) files through the Cesium Sandcastle at <https://sandcastle.cesium.com>.
- `Felt`: Allows to open XYZ tile services (relation type `xyz`, see [web-map-links extension](https://github.com/stac-extensions/web-map-links/blob/v1.2.0/README.md#xyz)) files through Felt at <https://felt.com/map/>.
- `Geofox`: Allows to open OGC 3D Tiles (relation type `3d-tiles`, see [web-map-links extension](https://github.com/stac-extensions/web-map-links/blob/v1.2.0/README.md#3d-tiles)) files through the 3D Assets Viewer at <https://viewer.geofox.ai>.
- `Protomaps`: Allows to open PMTiles (relation type `pmtiles`, see [web-map-links extension](https://github.com/stac-extensions/web-map-links/blob/v1.2.0/README.md#pmtiles)) files through PMTiles Viewer at <https://pmtiles.io>.

All actions for links are stored in the folder [`src/actions/links`](../src/actions/links) if you want to inspect them.

The actions can be enabled by adding them to the [`linkActions.config.js`](../linkActions.config.js) file.
Open the file and you'll see a number of imports and exports.
Import the file for the action that you want to enable, e.g. for PMTiles / Protomaps:

```js
import Protomaps from './src/actions/links/Protomaps.js';
```

The path is fixed to `./src/actions/links/`, the file extension is always `.js`.
In-between add the file name from the list above.
The import name should be the file name without extension (i.e. `Protomaps` again).

Lastly, add the import name to the list of exports, e.g.

```js
export default {
  OtherAction,
  Protomaps
};
```

Save the file and rebuild / restart STAC Browser.

## Developer Guide

Implementing actions for assets and links follows a very similar pattern.
The main difference is that assets implement the [`AssetActionPlugin` interface](../src/actions/AssetActionPlugin.js) while links implement the [`LinkActionPlugin` interface](../src/actions/LinkActionPlugin.js).
Similarly, actions for assets are stored in the folder links are stored in the folder [`src/actions/assets`](../src/actions/assets) while links are stored in the folder [`src/actions/links`](../src/actions/links).

The interfaces for both look as follows:

- `constructor(data: object, component: Vue, id: string)`
  - `data`: The asset or link object, it is available in the class through `this.asset` (for assets) and `this.link` (for links).
  - `component`: The parent Asset/Link Vue component (available in the class through `this.component`)
  - `id`: Internal ID of the asset or link, not meant to be used.
- `get btnOptions() : object`
  - This should return an object of button options, see [VueBootstrap b-button](https://bootstrap-vue.org/docs/components/button/#component-reference) for details. Returns `href`, `rel` (only for links) and `target` (set to `_blank`) by default.
- `get onClick() : function(event: MouseEvent)`
  - Returns a function that accepts a [MouseEvent](https://developer.mozilla.org/de/docs/Web/API/MouseEvent). This is the action to execute in case no `href` is set.
- `get uri() : string`
  - Returns the URL to use as `href` for the button/link. This should a valid URL that a browser can navigate to, including the asset or link URL as a query parameter or so.
- `get show() : boolean`
  - Return `true` if the action should be shown for the given asset or link. Return `false` otherwise, default to `false`.
- `get text() : string`
  - Returns the text that is displayed for the button, defaults to "Open". Should be using the [i18n methods](https://kazupon.github.io/vue-i18n/api/#methods) to localize the text, e.g. `this.i18n.t('my.message')`.
- `get icon() : Vue`
  - Returns a Vue component that should be the icon for the button. Defaults to `BIconBoxArrowUpRight`, see <https://bootstrap-vue.org/docs/icons#icons-1> and search for `arrow-up-right`.

Each action should at least implement custom behaviour for `uri`, `show` and `text`.

It is recommended to inspect the existing actions to get an impression of what is possible and how it is implemented.

Some notes:

- It is recommended to use [urijs](https://www.npmjs.com/package/urijs) for URL manipulations, it comes packages with STAC Browser anyway.
- It can be helpful to use the Vue component that is available through `this.component`, for example:
  - `this.component.href` is the absolute asset URL (while `this.asset.href` could be relative or absolute)
  - `this.component.isBrowserProtocol` returns whether it's a http/https URL
  - `this.asset.type` / `this.link.type` contains the media type of the asset/link

To enable a newly implemented action in STAC Browser, please follow the [User Guide](#user-guide).
