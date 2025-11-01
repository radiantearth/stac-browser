import LinkActionPlugin from "../LinkActionPlugin";
import URI from 'urijs';

export default class Cesium extends LinkActionPlugin {

  get show() {
    return this.link.rel === '3d-tiles';
  }

  get uri() {
    // https://sandcastle.cesium.com/standalone.html vs https://sandcastle.cesium.com/index.html
    let uri = new URI("https://sandcastle.cesium.com/standalone.html");
    const tileset_url = this.link.href;
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
    return this.i18n.t('actions.openIn', {service: 'Cesium Sandcastle'});
  }

}
