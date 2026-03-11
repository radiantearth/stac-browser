import { STACReference } from './reference.js';

export class Link extends STACReference {
  constructor(data) {
    super(data);
  }

  build() {
    return this.data;
  } 
}
