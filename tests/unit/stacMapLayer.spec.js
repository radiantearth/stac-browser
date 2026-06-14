import { describe, it, expect, beforeEach } from 'vitest'
import StacMapLayer, { isGlobalBbox } from '../../src/components/maps/StacMapLayer.js'

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

// A Cloud-Optimized GeoTIFF asset. The deck.gl render path is guarded off when
// the (fake) map has no addControl, so these exercise the list/visibility logic
// without network or WebGL.
function cogAsset(key, opts = {}) {
  return {
    type: 'image/tiff; application=geotiff; profile=cloud-optimized',
    title: opts.title,
    roles: opts.roles || ['data'],
    bands: [],
    getKey: () => key,
    getAbsoluteUrl: () => `https://example.com/${key}.tif`,
    href: `https://example.com/${key}.tif`,
  }
}

function fakeStac(assets, renders) {
  return { getAssets: () => assets, toGeoJSON: () => null, renders }
}

// A COG asset that exposes only `.key` (no getKey()), as some stac-js asset
// shapes do. Exercises the cogKey() fallback end-to-end.
function cogAssetKeyOnly(key) {
  return {
    type: 'image/tiff; application=geotiff; profile=cloud-optimized',
    roles: ['data'],
    bands: [],
    key,
    getAbsoluteUrl: () => `https://example.com/${key}.tif`,
    href: `https://example.com/${key}.tif`,
  }
}

// A deck.gl backend test double + a map that accepts a deck overlay control, so
// the COG render reconciliation (_syncCogLayers / _makeCogLayer / cache) can be
// exercised without WebGL. Inject via `layer._loadDeckDeps`.
function fakeDeckDeps() {
  class FakeCOGLayer {
    constructor(props) { this.props = props }
  }
  class FakeOverlay {
    constructor(props) { this.props = props; this.setPropsCount = 0 }
    setProps(props) { this.props = { ...this.props, ...props }; this.setPropsCount++ }
  }
  class FakeDecoderPool {
    constructor(opts) { this.opts = opts }
  }
  return async () => ({ MapboxOverlay: FakeOverlay, COGLayer: FakeCOGLayer, DecoderPool: FakeDecoderPool })
}

function createDeckCapableMap() {
  const map = createFakeMap()
  map.controls = []
  map.addControl = (c) => { map.controls.push(c) }
  map.removeControl = (c) => { map.controls = map.controls.filter(x => x !== c) }
  return map
}

const overlayLayerIds = layer =>
  (layer._deckOverlay?.props.layers || []).map(l => l.props.id)

describe('StacMapLayer', () => {
  let map
  let layer

  beforeEach(() => {
    map = createFakeMap()
    layer = new StacMapLayer(map)
  })

  describe('COG layer list', () => {
    const cogOverlays = l =>
      l.getAssetOverlays().filter(o => o.type === 'deckgl')
    const cogIds = l => cogOverlays(l).map(o => o.id)
    const visibleCogIds = l =>
      cogOverlays(l).filter(o => o.visible).map(o => o.id)

    it('lists every COG asset of the item, not just the active one', async () => {
      const assets = ['a', 'b', 'c', 'd', 'e', 'f'].map(k => cogAsset(k))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[0]])
      expect(cogIds(layer)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
    })

    it('shows exactly one COG (the active one) on by default', async () => {
      const assets = ['a', 'b', 'c'].map(k => cogAsset(k))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[1]])
      expect(visibleCogIds(layer)).toEqual(['b'])
    })

    it('caps the list at 8 COGs', async () => {
      const assets = Array.from({ length: 10 }, (_, i) => cogAsset(`c${i}`))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[0]])
      expect(cogIds(layer)).toHaveLength(8)
    })

    it('setCogVisible toggles by id and allows multiple visible at once', async () => {
      const assets = ['a', 'b', 'c'].map(k => cogAsset(k))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[0]])
      layer.setCogVisible('b', true)
      expect(visibleCogIds(layer)).toEqual(['a', 'b'])
      layer.setCogVisible('a', false)
      expect(visibleCogIds(layer)).toEqual(['b'])
    })

    it('show-on-map solos: re-selecting one asset turns the others off', async () => {
      const assets = ['a', 'b', 'c'].map(k => cogAsset(k))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[0]])
      layer.setCogVisible('b', true)
      layer.setCogVisible('c', true)
      await layer.setAssets([assets[1]])
      expect(visibleCogIds(layer)).toEqual(['b'])
    })

    it('swaps a not-listed COG into the capped list, evicting the last entry', async () => {
      const assets = Array.from({ length: 9 }, (_, i) => cogAsset(`c${i}`))
      layer.setStac(fakeStac(assets))
      await layer.setAssets([assets[0]])
      expect(cogIds(layer)).toEqual([
        'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
      ])

      await layer.setAssets([assets[8]])
      const ids = cogIds(layer)
      expect(ids).toHaveLength(8)
      expect(ids).toContain('c8')
      expect(ids).not.toContain('c7')
      expect(visibleCogIds(layer)).toEqual(['c8'])
    })
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

  describe('isGlobalBbox', () => {
    it('is true for a full-world bbox', () => {
      expect(isGlobalBbox([-180, -84, 180, 84])).toBe(true)
    })

    it('is true for a near-global bbox', () => {
      // The FTW global grid: -180..180 lon, -60..84 lat
      expect(isGlobalBbox([-180, -60, 180, 84])).toBe(true)
    })

    it('is false for a country-sized bbox', () => {
      // Netherlands-ish
      expect(isGlobalBbox([3.3, 50.7, 7.2, 53.6])).toBe(false)
    })

    it('is false for a continent that is not full-width', () => {
      // Africa spans ~75° of longitude — wide, but not global.
      expect(isGlobalBbox([-20, -35, 55, 38])).toBe(false)
    })

    it('is false for missing/short bboxes', () => {
      expect(isGlobalBbox(null)).toBe(false)
      expect(isGlobalBbox([0, 0, 1])).toBe(false)
    })
  })

  describe('fit', () => {
    function fitMap() {
      const calls = { fitBounds: [], jumpTo: [] }
      return {
        calls,
        getLayoutProperty: () => undefined,
        setLayoutProperty: () => {},
        // A deliberately far-north center, as web-mercator cameraForBounds
        // returns for global bounds — fit() should not use this latitude.
        cameraForBounds: () => ({ center: [0, 45], zoom: 1 }),
        fitBounds: (bounds, opts) => calls.fitBounds.push({ bounds, opts }),
        jumpTo: (opts) => calls.jumpTo.push(opts),
      }
    }
    const stacWith = bbox => ({ getBoundingBox: () => bbox })

    it('zooms a global dataset in 2 levels past the fit zoom', () => {
      const m = fitMap()
      const l = new StacMapLayer(m)
      l.stac = stacWith([-180, -60, 180, 84])
      l.fit()
      expect(m.calls.jumpTo).toHaveLength(1)
      expect(m.calls.jumpTo[0].zoom).toBe(3) // cameraForBounds zoom 1 + 2
      // Centered on the geographic midpoint of the bbox, not the far-north
      // mercator center: midLon 0, midLat (-60 + 84) / 2 = 12.
      expect(m.calls.jumpTo[0].center).toEqual([0, 12])
      expect(m.calls.fitBounds).toHaveLength(0)
    })

    it('uses plain fitBounds for a non-global dataset', () => {
      const m = fitMap()
      const l = new StacMapLayer(m)
      l.stac = stacWith([3.3, 50.7, 7.2, 53.6])
      l.fit()
      expect(m.calls.fitBounds).toHaveLength(1)
      expect(m.calls.jumpTo).toHaveLength(0)
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

  // Exercises the actual deck.gl reconciliation (_syncCogLayers / _makeCogLayer /
  // cache) by injecting a deck backend test double — no WebGL needed.
  describe('COG render reconciliation (deck path)', () => {
    let dmap, dlayer
    beforeEach(() => {
      dmap = createDeckCapableMap()
      dlayer = new StacMapLayer(dmap)
      dlayer._loadDeckDeps = fakeDeckDeps()
    })

    it('renders only the active COG as a deck layer', async () => {
      const assets = ['a', 'b', 'c'].map(k => cogAsset(k))
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[1]])
      expect(overlayLayerIds(dlayer)).toEqual(['stac-cog-b'])
      expect(dmap.controls).toHaveLength(1)
    })

    it('reuses the cached COGLayer instance when toggling another COG on', async () => {
      const assets = ['a', 'b'].map(k => cogAsset(k))
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[0]])
      const firstA = dlayer._cogLayerCache.get('a')
      await dlayer.setCogVisible('b', true)
      // 'a' must be the same instance — re-creating it would abort its tiles.
      expect(dlayer._cogLayerCache.get('a')).toBe(firstA)
      expect(overlayLayerIds(dlayer).sort()).toEqual(['stac-cog-a', 'stac-cog-b'])
    })

    it('prunes cached layers that drop off the list', async () => {
      const assets = Array.from({ length: 9 }, (_, i) => cogAsset(`c${i}`))
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[0]])
      expect(dlayer._cogLayerCache.has('c0')).toBe(true)
      // 8 actives (c1..c8) fill the cap, so c0 falls off the list entirely.
      await dlayer.setAssets(assets.slice(1, 9))
      expect(dlayer._cogLayerCache.has('c0')).toBe(false)
      expect([...dlayer._cogLayerCache.keys()].sort())
        .toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'])
    })

    it('removes the overlay when the last COG is hidden', async () => {
      const assets = [cogAsset('a')]
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[0]])
      expect(dmap.controls).toHaveLength(1)
      await dlayer.setCogVisible('a', false)
      expect(dmap.controls).toHaveLength(0)
      expect(dlayer._deckOverlay).toBeNull()
    })

    it('rebuilds COG layers after a style change re-adds the same assets', async () => {
      const assets = [cogAsset('a')]
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[0]])
      expect(overlayLayerIds(dlayer)).toEqual(['stac-cog-a'])
      // Basemap/style change tears everything down then re-adds identical assets.
      dlayer.assets = assets
      await dlayer.readdAfterStyleChange()
      expect(overlayLayerIds(dlayer)).toEqual(['stac-cog-a'])
    })

    it('handles COG assets that expose only .key (no getKey)', async () => {
      const assets = [cogAssetKeyOnly('k1'), cogAssetKeyOnly('k2')]
      dlayer.setStac(fakeStac(assets))
      await dlayer.setAssets([assets[0]])
      expect(overlayLayerIds(dlayer)).toEqual(['stac-cog-k1'])
    })

    it('synthesizes a render from the first declared render for an untargeted asset', async () => {
      const assets = [cogAsset('disp')]
      const renders = {
        alpha: { colormap_name: 'viridis', assets: ['other'] },
        beta: { colormap_name: 'magma', assets: ['other'] },
      }
      dlayer.setStac(fakeStac(assets, renders))
      await dlayer.setAssets([assets[0]])
      expect(dlayer._cogList[0].render.colormap_name).toBe('viridis')
    })
  })
})
