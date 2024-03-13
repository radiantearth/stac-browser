# Actions

STAC Browser has a pluggable interface to share or open assets and links with other services, which we call "actions".

An action adds a button to an asset or link if certain requirements are met, which can then be executed by users.
For example, you could open COPC files in a dedicated COPC Viewer, which otherwise you could only download.

## Assets

All actions for assets are stored in the folder [`src/actions/assets`](../src/actions/assets).
They all implement the [`AssetActionPlugin` interface](../src/actions/AssetActionPlugin.js).
The actions can be enabled by adding them to the [`assetActions.config.js`](../assetActions.config.js) file.

### cogeo.xyz

Adds an `Open in cogeo.xyz` button that allows to open Cloud-Optimized GeoTiff (COG) files on <https://cogeo.xyz>.

```js
import CoGeoXyz from './src/actions/assets/CoGeoXyz.js';
export default { CoGeoXyz };
```

### copc.io

Adds an `Open in copc.io` button that allows to open Cloud-Optimized Point Cloud (COPC) files on <https://viewer.copc.io>.

```js
import CopcViewer from './src/actions/assets/CopcViewer.js';
export default { CopcViewer };
```

### Felt (Assets)

Adds an `Open in Felt` button that allows to import KML, KMZ, GeoTiff and GeoJSON assets to <https://felt.com>.

```js
import Felt from './src/actions/assets/Felt.js';
export default { Felt };
```

### geojson.io

Adds an `Open in geojson.io` button that allows to open GeoJSON files on <https://geojson.io>.

```js
import GeoJsonIo from './src/actions/assets/GeoJsonIo.js';
export default { GeoJsonIo };
```

## Links

All actions for links are stored in the folder [`src/actions/links`](../src/actions/links).
They all implement the [`LinkActionPlugin` interface](../src/actions/LinkActionPlugin.js).
The actions can be enabled by adding them to the [`linkActions.config.js`](../linkActions.config.js) file.

### Felt (Links)

Adds an `Open in Felt` button that allows to show XYZ tile services on <https://felt.com>.
The link to the XYZ has to follow the [web-map-links extension](https://github.com/stac-extensions/web-map-links/blob/v1.0.0/README.md#xyz).

```js
import Felt from './src/actions/links/Felt.js';
export default { Felt };
```