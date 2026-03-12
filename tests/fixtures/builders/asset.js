import STACReference from "./reference";

export default class Asset extends STACReference {
  constructor(data) {
    super(data);
  }

  build() {
    return this.data;
  }
}
