import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

const POTREE_SUPPORTED_TYPES = [
  'application/vnd.laszip+copc',
];

// this.component.filename.endsWith or this.asset.href.includes
const POTREE_SUPPORTED_FILEEXTS = [
 'cloud.js', 'metadata.json', 'ept.json'
 // potree v1, potree v2, EPT Entwine Point Tiles
];
  
export default class Potree extends AssetActionPlugin {

  get show() {
    // todo: this should check for the pointcloud extension or other indications that this asset is actually point cloud related
    // as the metadata.json matching is rather greedy. Should be possible once stac-js is implemented.
    return this.component.isBrowserProtocol && (
      POTREE_SUPPORTED_TYPES.includes(this.asset.type)
      || POTREE_SUPPORTED_FILEEXTS.map(
        f => URI(this.asset.href).filename().endsWith(f)
      ).some(e => e)
  );
  }

  get uri() {
    // Docs: PR made to original potree repo to avoid relying on iconem own infrastructure
    // https://github.com/potree/potree/pull/1456 
    // would be accessible via https://potree.org/potree/examples/load_potree_project_from_urlparam.html
    // Can also parse pointSize, FOV, opacity, edlEnabled, edlRadius, edlStrength, pointBudget, showBoundingBox, pointSizing, quality, position, target, background via loadSettingsFromURL
    // Alternatives with single potree-supported tileset support and less param parsed
    // https://mpc-copc-viewer.netlify.app?c=rgba&r= Darren Wiens app, which works eg with IGN COPC: 
    // https://potree.org/potree/examples/copc.html?c=rgba&r= Potree copc app
    let uri = new URI("https://3d.iconem.com/apps/load_potree_project_from_urlparam");
    const datasetUrl = this.component.href;
    uri.addQuery('fit', 'true');
    uri.addQuery('c', 'elevation'); // rgba, elevation, intensity etc
    uri.addQuery('datasetsUrls', `["${datasetUrl}"]`); 
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'potree.org'});
  }

}