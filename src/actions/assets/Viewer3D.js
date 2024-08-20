import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';
import i18n from "../../i18n";

// obj & ply files are usually with mime-type text/plain 
const VIEWER3D_SUPPORTED_TYPES = [
  'model/gltf-binary', 
  'model/gltf+json',
  'application/fbx',
];
// below is usually text/plain
const VIEWER3D_SUPPORTED_FILEEXTS = ['.obj', '.ply', '.fbx', '.glb', '.gltf'];
export default class Viewer3D extends AssetActionPlugin {

  get show() {
    return this.component.isBrowserProtocol && (
      VIEWER3D_SUPPORTED_TYPES.includes(this.asset.type)
      || VIEWER3D_SUPPORTED_FILEEXTS.map(
        f => this.asset.href.toLowerCase().includes(f)
      ).some(e => e)
    );
  }

  get uri() {
    // `https://3dviewer.net/#model=${modelUrl}` misconception, # is not a fragment but a query, can be replaced
    let uri = new URI("https://3dviewer.net/");
    uri.addQuery("model", this.component.href); // returns the URI instance for chaining
    uri = uri.toString().replace('?', '#');
    return uri;
  }

  get text() {
    return i18n.t('actions.openIn', {service: '3dviewer.net'});
  }

}