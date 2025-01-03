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
    return this.component.isBrowserProtocol && (
      POTREE_SUPPORTED_TYPES.includes(this.asset.type)
      || POTREE_SUPPORTED_FILEEXTS.map(
        f => this.asset.href.toLowerCase().includes(f)
      ).some(e => e)
  );
  }

  get uri() {
    // Docs: PR made to original potree repo to avoid relying on iconem own infrastructure
    // https://github.com/potree/potree/pull/1456 
    // would be accessible via https://potree.org/potree/examples/load_potree_project_from_urlparam.html
    // Can also parse pointSize, FOV, opacity, edlEnabled, edlRadius, edlStrength, pointBudget, showBoundingBox, pointSizing, quality, position, target, background via loadSettingsFromURL
    let uri = new URI("https://3d.iconem.com/tools/load_potree_project_from_urlparam.html");
    const datasetUrl = this.component.href;
    uri.addQuery('fit', 'true');
    uri.addQuery('c', 'elevation'); // rgba, elevation, intensity etc
    uri.addQuery('datasetsUrls', `["${datasetUrl}"]`); 
    return uri;
  }

  get uri2() {
    // Could also use directly Darren Wiens app, which works eg with IGN COPC: 
    let uri = new URI("https://mpc-copc-viewer.netlify.app");
    uri.addQuery('c', 'rgba');
    uri.addQuery('r', this.component.href);
    // color type can be among rgba, elevation, color, elevation, etc
    // https://potree.org/potree/examples/copc.html?c=rgba&r=
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: 'potree.org'});
  }

}