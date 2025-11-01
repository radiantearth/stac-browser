import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';

// obj & ply files are usually with mime-type text/plain 
const THREEPIPE_SUPPORTED_TYPES = [
  'model/gltf-binary', 
  'model/gltf+json',
  'application/fbx',
];
// below is usually text/plain
const THREEPIPE_SUPPORTED_FILEEXTS = ['obj', 'ply', 'fbx', 'glb', 'gltf', 'stl', 'usdz'];
export default class ThreePipe extends AssetActionPlugin {

  get show() {
    const suffix = URI(this.asset.href).suffix();
    return this.component.isBrowserProtocol && (
      THREEPIPE_SUPPORTED_TYPES.includes(this.asset.type)
      || THREEPIPE_SUPPORTED_FILEEXTS.some(ext => (suffix === ext))
    );
  }

  get uri() {
    let uri = new URI("https://threepipe.org/examples/tweakpane-editor");
    uri.addQuery("model", this.component.href); 
    return uri;
  }


  get text() {
    return this.i18n.t('actions.openIn', {service: 'ThreePipe'});
  }

}
