# Basemaps

STAC Browser supports various types of basemaps in different projections.

The following types (sources) of basemaps are officially supported:

- Vector Tiles, with Mapbox/MapLibre styles
- WMTS (OGC Web Map Tile Service)
- WMS (OGC Web Map Service), tiled
- XYZ (Slippy web map tiles), e.g. OpenStreetMap

The file [`basemaps.config.js`](../basemaps.config.js) contains the configuration for the basemaps.

There are two ways to provide the basemap configuration:

1. Simply update either the `BASEMAPS` object
2. Write a custom `configureBasemap` function that returns the desired options for OpenLayers

A default implementation for `configureBasemap` is provided, which makes use of the `BASEMAPS` object.
It supports providing different basemaps per celestial body (e.g. Earth, Moon, Mars, etc.).
The default basemaps are:

- For the Earth it is OpenStreetMaps as XYZ in EPSG:3857
- For the other celestial bodies it is USGS Planetary Maps as WMS in EPSG:4326

The easiest way to add or change the maps for the Earth, is to update the `earth` array in the `BASEMAPS` object.
Each object in the arrays defines the [basemap options](#options).

An alternative is to remove the `BASEMAPS` array and implement a custom version of the `configureBasemap` function.
The function reveived the STAC object and the I18N object as inputs, which allows you to provide different basemaps per STAC entity if needed.
The function must return an array of objects, where each object provides the [basemap options](#options).

## Options

Each object in the arrays provided in the config (see above) provides the options for a single basemap.
The options follow mostly the OpenLayers documentation of the given source type.

Each object must contain the following properties:

- `is`: The type of the OpenLayers source:
  - [VectorTile (Mapbox)](#vector-tiles-mapbox)
  - [TileWMS](#wms)
  - [WMTS](#wmts)
  - [XYZ](#xyz)
  - Additional OpenLayers source may also work, but were not tested yet.
- `title`: A title for the basemap, will be shown in the layer chooser. Can be localized in `configureBasemap`, if needed.

For any additional options, please click the links for the source above and refer to the OpenLayers source options.
Commonly used are: `url`, `attributions` and `projection` (if available for the source).
See below for more details regarding each source and its specific configuration.

> [!IMPORTANT]
> If you set a projection that is not `EPSG:4326` or `EPSG:3857`, you need to provide information about the
> CRS in the `config.js` file, property `crs`. See the [CRS documentation](options.md#crs) for more details.

### layerCreated

There's one additional option `layerCreated` that is not part of OpenLayers,
which allows to provide a function to change the source and layer after its creation.
It has the following signature: `async layerCreated(Layer layer, Source source, Map map) => Layer`.

(Rather arbitrary) example that adds error handling:

```js
layerCreated: async (layer, source, map, options) => {
  source.once('error', e => console.error(e));
  layer.once('error', e => console.error(e));
  return layer;
}
```

### Sources

#### Vector Tiles (Mapbox)

- OpenLayers source: - (use `VectorTileStyle` for the `is` property, but it's not an OpenLayer source)
- OpenLayers layer: `Group`

For vector tiles, you need the package `ol-mapbox-style`, which is an optional dependency
but will be installed by default unless explicitly omitted by you.

STAC Browser supports loading vector tiles via a Mapbox/MapLibre styles file.

Example to use OpenFreeMap as basemap:

```js
{
  url: 'https://tiles.openfreemap.org/styles/liberty',
  is: 'VectorTileStyle',
  title: 'OpenFreeMap Liberty',
  attributions: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
  projection: 'EPSG:3857'
}
```

#### WMS

> [!NOTE]
> Only tiled WMS are officially supported. Image WMS has not been tested.

- OpenLayers source: [`TileWMS`](https://openlayers.org/en/latest/apidoc/module-ol_source_TileWMS-TileWMS.html)
- OpenLayers layer: `WebGLTile`

For a WMS you usually need to provide the base URL of the service, a projection, and specific query parameters for the request,
often `LAYERS` (the layer name to show) and `FORMAT` (the media type of the file format to show).

Example for the swisstopo WMS (don't forget to add the CRS to the `crs` in `config.js`):

```js
{
  url: 'https://wms.geo.admin.ch/',
  is: 'TileWMS',
  title: 'Swisstopo Landeskarte',
  attributions: '&copy; swisstopo',
  projection: 'EPSG:2056',
  params: {
    LAYERS: 'ch.swisstopo.landeskarte-farbe-10',
    FORMAT: 'image/png',
  }
}
```

#### WMTS

- OpenLayers source: [`WMTS`](https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html)
- OpenLayers layer: `WebGLTile`

Providing a OGC Web Map Tile Service (WMTS) can be done in various ways, usually
either a URL template or a URL to the capabilties document is provided.
For more details see the [`WMTS`](https://openlayers.org/en/latest/apidoc/module-ol_source_WMTS-WMTS.html) source documentation.

Example for the swisstopo WMTS (don't forget to add the CRS to the `crs` in `config.js`):

```js
{
  url: 'https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml',
  is: 'WMTS',
  title: 'Swisstopo',
  attributions: '&copy; swisstopo',
  projection: 'EPSG:21781',
  layer: 'ch.swisstopo.swissimage',
}
```

#### XYZ

- OpenLayers source: [`XYZ`](https://openlayers.org/en/latest/apidoc/module-ol_source_XYZ-XYZ.html)
- OpenLayers layer: `WebGLTile`

Providing a XYZ is pretty straightforward.
The only property that is required is the `url`, which contains the URL template.
For additional options see [`XYZ`](https://openlayers.org/en/latest/apidoc/module-ol_source_XYZ-XYZ.html).

Example for OpenStreetMap:

```js
{
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  is: 'XYZ',
  title: 'OpenStreetMap',
  attributions: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.',
  projection: 'EPSG:3857'
}
```
