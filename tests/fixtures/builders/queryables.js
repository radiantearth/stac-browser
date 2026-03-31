import STACObject from "./object.js";
import URI from 'urijs';

export default class Queryables extends STACObject {
  constructor(instance) {
    super();
    this.url = 'queryables';
    this.instance = instance;
    this.method = 'GET';
    //TODO: more flexibility, use templates. 
    this.data = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        id: {
          type: 'string',
          title: 'Identifier'
        }
      }
    };
  }
  
  getAbsoluteUrl() {
    const absoluteUrl = URI(this.url, this.instance.root.getAbsoluteUrl());
    return absoluteUrl.toString();
  } 
}
