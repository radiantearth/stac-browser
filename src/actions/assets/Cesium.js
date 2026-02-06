import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

// See mime types discussion for 3d-tiles here and there
// https://github.com/opengeospatial/ogcapi-3d-geovolumes/issues/13
const OGC3DTILES_SUPPORTED_TYPES = [
  // 'application/json',
  'application/3dtiles+json',
];

export default class Cesium extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && OGC3DTILES_SUPPORTED_TYPES.includes(this.asset.type);
  }

  get uri() {
    // https://sandcastle.cesium.com/standalone.html vs https://sandcastle.cesium.com/index.html
    let uri = new URI("https://sandcastle.cesium.com/standalone.html");
    const tileset_url = this.component.href;
    const code_payload = {
      html: `
        <style> @import url(../templates/bucket.css); </style>
        <div id="cesiumContainer" class="fullSize"></div> 
      `, 
      code: `
        const viewer = new Cesium.Viewer("cesiumContainer", {
          terrain: Cesium.Terrain.fromWorldTerrain(),
        });

        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl('${tileset_url}');
          viewer.scene.primitives.add(tileset);
          viewer.zoomTo(tileset);
        } catch (error) {
          console.log('Error loading tileset');
        } 
      `.replaceAll('        ', '')
    };
    const code_str = btoa(JSON.stringify(code_payload));
    uri.addQuery('code', code_str);
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'Cesium Sandcastle'});
  }

}