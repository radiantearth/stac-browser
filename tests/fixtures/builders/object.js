export class STACObject {
  constructor(data) {
    this.data = data || {};
  }

  addBoundingBox(bbox) {
    this.data.bbox = bbox;
    return this;
  }

  removeBoundingBox() {
    delete this.data.bbox;
    return this;
  }

  addBoundingBoxes(bboxes) {
    this.data.bboxes = bboxes;
    return this;
  }

  removeBoundingBoxes() {
    delete this.data.bboxes;
    return this;
  }

  build() {
    return this.data;
  }
}
