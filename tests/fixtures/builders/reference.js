import STACObject from "./object";

export default class STACReference extends STACObject {
  constructor(data) {
    super(data)
    this.data = data || {};
  }
}
