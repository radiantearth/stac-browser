import View from 'ol/View';
import { transformWithProjections } from 'ol/proj';
import Vector from 'ol/source/Vector';
import Group from 'ol/layer/Group';

const MapUtils = {

  isLayerVisible(layer) {
    if (layer instanceof Group) {
      return layer.getLayers().getArray().some(l => this.isLayerVisible(l));
    }
    else {
      return layer.isVisible();
    }
  },

  reproject(map, projection) {
    const view = map.getView();
    const currentProjection = view.getProjection();
    if (currentProjection !== projection) {
      map.setView(new View({
        showFullExtent: true,
        projection,
        zoom: view.getZoom(),
        center: transformWithProjections(view.getCenter(), currentProjection, projection)
      }));
      this.reprojectLayers(map.getLayers(), currentProjection, projection);
    }
  },

  reprojectLayers(layers, sourceProjection, targetProjection) {
    for (const layer of layers.getArray()) {
      if (layer.get('base')) {
        continue;
      }
      if (layer instanceof Group) {
        this.reprojectLayers(layer.getLayers(), sourceProjection, targetProjection);
        continue;
      }
      const source = layer.getSource();
      if (source instanceof Vector) {
        // Handle vector layers
        const currentProjection = source.getProjection() || sourceProjection;
        const features = source.getFeatures();
        for (const feature of features) {
          const geometry = feature.getGeometry();
          if (geometry) {
            geometry.transform(currentProjection, targetProjection);
          }
        }
        source.refresh();
      }
      else {
        // else: todo: Handle other layer types if needed
      }
    }
  }
};

export default MapUtils;
