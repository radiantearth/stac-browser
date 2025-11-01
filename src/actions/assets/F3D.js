import AssetActionPlugin from "../AssetActionPlugin";
import URI from 'urijs';

// obj & ply files are usually with mime-type text/plain 
const F3D_SUPPORTED_TYPES = [
  'model/gltf-binary', 
  'model/gltf+json',
  'application/fbx',
];
// below is usually text/plain
const F3D_SUPPORTED_FILEEXTS = ['obj', 'ply', 'fbx', 'glb', 'gltf'];
export default class F3D extends AssetActionPlugin {

  get show() {
    const suffix = URI(this.asset.href).suffix();
    return this.component.isBrowserProtocol && (
      F3D_SUPPORTED_TYPES.includes(this.asset.type)
      || F3D_SUPPORTED_FILEEXTS.some(ext => (suffix === ext))
    );
  }

  get uri() {
    // `https://f3d.app/web/#model=${modelUrl}` see PR merged for parsing model url and extension:
    // https://github.com/f3d-app/f3d/pull/1596
    // Could enforce extension to help f3d.app determine the mesh type and loader to use
    let uri = new URI("https://f3d.app/web");
    uri.addQuery("model", this.component.href); 
    uri = uri.toString().replace('?', '#');
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'f3d.app'});
  }

}
