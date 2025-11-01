import LinkActionPlugin from "../LinkActionPlugin";
import URI from 'urijs';

export default class Felt extends LinkActionPlugin {

  get show() {
    // Docs: https://feltmaps.notion.site/Upload-Anything-b26d739e80184127872faa923b55d232#031104d5546b403bac111bca6685a225
    // - Must end with file extension
    // - Must contain x,y,z but not s variables
    let valid = (this.link.rel === 'xyz' && this.link.href.match(/^(https?:\/\/)(.+)\.(png|jpeg|jpg)$/i));
    if (valid) {
      return !this.link.href.includes('{s}') || (Array.isArray(this.link['href:servers']) && this.link['href:servers'].length > 0);
    }
    return false;
  }

  get uri() {
    // Docs: https://feltmaps.notion.site/Open-in-Felt-Button-22765a3427ff45e0a70218dca3f8acc0
    let uri = new URI("https://felt.com/map/new");
    let xyz = this.link.href;
    if (xyz.includes('{s}' && Array.isArray(this.link['href:servers']) && this.link['href:servers'].length > 0)) {
      xyz = xyz.replace('{s}', this.link['href:servers'][0]);
    }
    uri.addQuery('layer_urls[]', xyz);
    // once we migrate to stac-js:
    // todo: add title from STAC entity
    // todo: add lat/lon from item/collection: lat=57.14926&lon=-2.09348
    return uri;
  }

  get text() {
    return this.i18n.t('actions.openIn', {service: 'Felt'});
  }

}
