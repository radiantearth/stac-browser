import APICollection from "./apicollection.js";
import STACHypermedia from "./hypermedia.js";

// The response of a `/children` endpoint (STAC API - Children extension),
// containing both Catalogs and Collections.
export default class ChildrenCollection extends APICollection {
  constructor(instance, data, url) {
    super(instance, data, url);
  }

  addNewChild(child) {
    this.data.children = this.data.children || [];
    this.data.children.push(child);
    if (typeof this.data.numberMatched === 'number') {
      this.data.numberMatched++;
    }
    if (typeof this.data.numberReturned === 'number') {
      this.data.numberReturned++;
    }
    return this;
  }

  build(searchParams = {}) {
    const data = super.build();
    for(let child in data.children){
      if(data.children[child] instanceof STACHypermedia){
        data.children[child] = data.children[child].build();
      }
    }
    this.paginateData('children', searchParams);
    return data;
  }
}
