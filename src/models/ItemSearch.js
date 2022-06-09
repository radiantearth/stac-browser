import SortFragment from "./SortFragment";
import FilterFragment from './FilterFragment';
import ItemSearchCore from "./ItemSearchCore";


export default class ItemSearch {
  constructor () {
    this.coreSearchFields = new ItemSearchCore();
    this.sortFragment = new SortFragment();
    this.filterFragment = new FilterFragment();
  }

  async init(stac) {
    await this.coreSearchFields.init();
    await this.sortFragment.init();
    await this.filterFragment.init(stac);
  }

  getAsCql2Text () {
    const out = [];
    if (this.coreSearchFields.isSet) {
      out.push(this.coreSearchFields.asCql2Text);
    }
    if (this.sortFragment.isSet) {
      out.push(this.sortFragment.asCql2Text);
    }
    if (this.filterFragment.isSet) {
      out.push(this.filterFragment.asCql2Text);
    }
    return out.join('&');
  }

  getAsCql2Json () {
    let out = {}; 
    out = Object.assign(out, this.coreSearchFields.getAsCql2Json());
    out = Object.assign(out, this.sortFragment.getAsCql2Json());
    out = Object.assign(out, this.filterFragment.getAsCql2Json('and'));
    return out;
  }

}