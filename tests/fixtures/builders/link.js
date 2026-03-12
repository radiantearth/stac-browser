import STACReference from './reference.js';

export default class Link extends STACReference {
  constructor(data) {
    super(data);
  }

  build() {
    return this.data;
  } 
}
