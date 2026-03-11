import { STACReference } from "./reference";

export class Asset extends STACReference {
  constructor(data) {
    super(data);
  }

  build() {
    return this.data;
  }
}
