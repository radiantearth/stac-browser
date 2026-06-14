import { describe, it, expect } from 'vitest'
import { makeRenderTileLoader, resolveRenders } from '../../src/utils/renders.js'

// Build a fake deck.gl-geotiff COGLayer `image` whose fetchTile returns one
// interleaved single-band tile. Mirrors the { array: { data, width, height,
// layout } } shape makeRenderTileLoader consumes.
function fakeImage(data, width, height, layout = 'pixel-interleaved') {
  return {
    fetchTile: async () => ({ array: { data, width, height, layout } }),
  }
}

const call = (render, image) =>
  makeRenderTileLoader(render).getTileData(image, { x: 0, y: 0, signal: undefined })

describe('makeRenderTileLoader', () => {
  it('maps data values to opaque colors and nodata to transparent', async () => {
    const render = { colormap_name: 'viridis', rescale: [[0, 1]], bidx: [1], nodata: 0 }
    // 2x2, single band interleaved: [nodata, mid, max, nodata]
    const data = new Float32Array([0, 0.5, 1, 0])
    const res = await call(render, fakeImage(data, 2, 2))
    const px = res.colorImage.data
    expect(px[3]).toBe(0)    // pixel 0: nodata -> transparent
    expect(px[7]).toBe(255)  // pixel 1: data -> opaque
    expect(px[11]).toBe(255) // pixel 2: data -> opaque
    expect(px[15]).toBe(0)   // pixel 3: nodata -> transparent
  })

  it('bails (returns null) on a pathologically large tile instead of allocating', async () => {
    const render = { colormap_name: 'viridis', rescale: [[0, 1]], bidx: [1] }
    // 3000x3000 = 9M px exceeds the main-thread colormap budget.
    const res = await call(render, fakeImage(new Float32Array(1), 3000, 3000))
    expect(res).toBeNull()
  })

  it('returns null for a zero-dimension tile without throwing', async () => {
    const render = { colormap_name: 'viridis', rescale: [[0, 1]], bidx: [1] }
    const res = await call(render, fakeImage(new Float32Array(0), 0, 0))
    expect(res).toBeNull()
  })

  it('falls back to a real colormap when custom stops are malformed', async () => {
    // Numeric t but empty color arrays — the buggy version produces black (0,0,0).
    const render = { colormap: [[0, []], [1, []]], rescale: [[0, 1]], bidx: [1] }
    const res = await call(render, fakeImage(new Float32Array([0.5]), 1, 1))
    const px = res.colorImage.data
    expect(px[3]).toBe(255)                  // opaque
    expect(px[0] + px[1] + px[2]).toBeGreaterThan(0) // a real color, not black
  })

  it('handles a pathologically long nodata array without error', async () => {
    const nodata = Array.from({ length: 100000 }, (_, i) => i + 1000)
    const render = { colormap_name: 'viridis', rescale: [[0, 1]], bidx: [1], nodata }
    const res = await call(render, fakeImage(new Float32Array([0.5]), 1, 1))
    expect(res.colorImage.data[3]).toBe(255) // value 0.5 is not nodata -> opaque
  })
})

describe('resolveRenders', () => {
  it('reads top-level renders from an item', () => {
    expect(resolveRenders({ renders: { a: { title: 'A' } } })).toEqual({ a: { title: 'A' } })
  })
  it('returns {} when absent', () => {
    expect(resolveRenders({})).toEqual({})
    expect(resolveRenders(null)).toEqual({})
  })
})
