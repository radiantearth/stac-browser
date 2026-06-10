import { describe, it, expect, beforeEach } from 'vitest'
import StacMapLayer from '../../src/components/maps/StacMapLayer.js'

// Minimal fake of a MapLibre GL map that faithfully reproduces the behavior
// that surfaced the bug: addSource/addLayer throw when the id already exists,
// just like the real implementation. Sources/layers persist until explicitly
// removed, mirroring how imperatively-added sources can survive a setStyle().
function createFakeMap() {
  const sources = new Map()
  const layers = new Map()
  return {
    sources,
    layers,
    addSource(id, spec) {
      if (sources.has(id)) {
        throw new Error(`Source "${id}" already exists.`)
      }
      sources.set(id, spec)
    },
    getSource(id) {
      return sources.get(id)
    },
    removeSource(id) {
      if (!sources.has(id)) {
        throw new Error(`There is no source with this ID "${id}"`)
      }
      sources.delete(id)
    },
    addLayer(spec) {
      if (layers.has(spec.id)) {
        throw new Error(`Layer "${spec.id}" already exists.`)
      }
      layers.set(spec.id, spec)
    },
    getLayer(id) {
      return layers.get(id)
    },
    removeLayer(id) {
      if (!layers.has(id)) {
        throw new Error(`The layer "${id}" does not exist in the map's style.`)
      }
      layers.delete(id)
    },
    getStyle() {
      return { layers: [...layers.values()] }
    },
    getLayoutProperty() {
      return undefined
    },
    setLayoutProperty() {},
  }
}

// An XYZ vector tile asset exercises the same guarded source path as PMTiles
// without requiring network access or the pmtiles protocol, making it ideal
// for a fast, deterministic unit test.
function xyzVectorAsset() {
  return {
    href: 'https://example.com/tiles/{z}/{x}/{y}.pbf',
    type: 'application/vnd.mapbox-vector-tile',
    title: 'Test tiles',
  }
}

describe('StacMapLayer', () => {
  let map
  let layer

  beforeEach(() => {
    map = createFakeMap()
    layer = new StacMapLayer(map)
  })

  describe('readdAfterStyleChange', () => {
    it('re-adds tile assets without throwing "source already exists"', async () => {
      await layer.setAssets([xyzVectorAsset()])
      expect(map.sources.has('stac-tile-0')).toBe(true)

      // Reproduces issue #13: a basemap change re-runs the layer setup while
      // the previous source still exists on the map.
      await expect(layer.readdAfterStyleChange()).resolves.not.toThrow()

      expect(map.sources.has('stac-tile-0')).toBe(true)
    })

    it('does not duplicate or leak the tile source across repeated changes', async () => {
      await layer.setAssets([xyzVectorAsset()])

      await layer.readdAfterStyleChange()
      await layer.readdAfterStyleChange()

      const tileSources = [...map.sources.keys()].filter(id =>
        id.startsWith('stac-tile-')
      )
      expect(tileSources).toEqual(['stac-tile-0'])
      expect(layer._pmtilesSourceIds).toEqual(['stac-tile-0'])
    })

    it('preserves the rendered tile layers after a style change', async () => {
      await layer.setAssets([xyzVectorAsset()])
      const before = layer._pmtilesLayerIds.length
      expect(before).toBeGreaterThan(0)

      await layer.readdAfterStyleChange()

      expect(layer._pmtilesLayerIds.length).toBe(before)
      for (const id of layer._pmtilesLayerIds) {
        expect(map.layers.has(id)).toBe(true)
      }
    })
  })

  describe('_addPmtilesSource', () => {
    it('replaces an existing source instead of throwing', () => {
      layer._addPmtilesSource('stac-tile-0', { type: 'vector', tiles: ['a'] })
      expect(() =>
        layer._addPmtilesSource('stac-tile-0', { type: 'vector', tiles: ['b'] })
      ).not.toThrow()

      expect(map.sources.get('stac-tile-0').tiles).toEqual(['b'])
      expect(layer._pmtilesSourceIds).toEqual(['stac-tile-0'])
    })
  })
})
