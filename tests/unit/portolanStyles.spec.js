import { describe, it, expect, vi } from 'vitest'
import { resolveStyles, extractLegend, loadStyleJson } from '../../src/utils/portolanStyles.js'

describe('portolanStyles', () => {
  describe('extractLegend', () => {
    it('returns empty array for null style', () => {
      expect(extractLegend(null)).toEqual([])
    })

    it('returns empty array when no layers', () => {
      expect(extractLegend({})).toEqual([])
      expect(extractLegend({ layers: [] })).toEqual([])
    })

    it('returns empty array when no fill layer', () => {
      const style = {
        layers: [{ type: 'line', paint: {} }]
      }
      expect(extractLegend(style)).toEqual([])
    })

    it('returns empty array for string fill-color', () => {
      const style = {
        layers: [{ type: 'fill', paint: { 'fill-color': '#ff0000' } }]
      }
      expect(extractLegend(style)).toEqual([])
    })

    it('parses step expression', () => {
      const style = {
        layers: [{
          type: 'fill',
          paint: {
            'fill-color': [
              'step',
              ['get', 'value'],
              '#ccc',      // default color
              10, '#red',  // stop 1
              20, '#blue', // stop 2
              30, '#green' // stop 3
            ]
          }
        }]
      }
      const legend = extractLegend(style)
      expect(legend).toHaveLength(4)
      expect(legend[0]).toEqual({ color: '#ccc', label: '< 10' })
      expect(legend[1]).toEqual({ color: '#red', label: '10–20' })
      expect(legend[2]).toEqual({ color: '#blue', label: '20–30' })
      expect(legend[3]).toEqual({ color: '#green', label: '30+' })
    })

    it('parses match expression', () => {
      const style = {
        layers: [{
          type: 'fill',
          paint: {
            'fill-color': [
              'match',
              ['get', 'category'],
              'residential', '#ff0000',
              'commercial', '#00ff00',
              'industrial', '#0000ff',
              '#cccccc' // fallback
            ]
          }
        }]
      }
      const legend = extractLegend(style)
      expect(legend).toHaveLength(3)
      expect(legend[0]).toEqual({ color: '#ff0000', label: 'residential' })
      expect(legend[1]).toEqual({ color: '#00ff00', label: 'commercial' })
      expect(legend[2]).toEqual({ color: '#0000ff', label: 'industrial' })
    })

    it('handles numeric match values', () => {
      const style = {
        layers: [{
          type: 'fill',
          paint: {
            'fill-color': [
              'match',
              ['get', 'code'],
              1, '#red',
              2, '#blue',
              '#gray'
            ]
          }
        }]
      }
      const legend = extractLegend(style)
      expect(legend[0].label).toBe('1')
      expect(legend[1].label).toBe('2')
    })
  })

  describe('resolveStyles', () => {
    it('returns empty array when no styles property', () => {
      const stac = { properties: {} }
      expect(resolveStyles(stac)).toEqual([])
    })

    it('returns empty array when styles is empty', () => {
      const stac = { properties: { 'portolan:styles': [] } }
      expect(resolveStyles(stac)).toEqual([])
    })

    it('resolves string entries from assets', () => {
      const stac = {
        properties: { 'portolan:styles': ['style1'] },
        assets: {
          style1: {
            title: 'My Style',
            href: 'styles/style1.json',
            getAbsoluteUrl: () => 'https://example.com/styles/style1.json'
          }
        },
        getAbsoluteUrl: () => 'https://example.com/'
      }
      const result = resolveStyles(stac)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('style1')
      expect(result[0].title).toBe('My Style')
      expect(result[0].href).toBe('https://example.com/styles/style1.json')
    })

    it('skips missing asset references', () => {
      const stac = {
        properties: { 'portolan:styles': ['missing'] },
        assets: {},
        getAbsoluteUrl: () => 'https://example.com/'
      }
      expect(resolveStyles(stac)).toEqual([])
    })

    it('resolves object entries with href', () => {
      const stac = {
        properties: {
          'portolan:styles': [{ name: 'custom', href: 'styles/custom.json' }]
        },
        assets: {},
        getAbsoluteUrl: () => 'https://example.com/'
      }
      const result = resolveStyles(stac)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('custom')
      expect(result[0].href).toBe('https://example.com/styles/custom.json')
    })

    it('strips common prefix from multiple style titles', () => {
      const stac = {
        properties: { 'portolan:styles': ['s1', 's2'] },
        assets: {
          s1: { title: 'Land Use - Residential', href: 's1.json', getAbsoluteUrl: () => 's1.json' },
          s2: { title: 'Land Use - Commercial', href: 's2.json', getAbsoluteUrl: () => 's2.json' }
        },
        getAbsoluteUrl: () => ''
      }
      const result = resolveStyles(stac)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Residential')
      expect(result[1].title).toBe('Commercial')
    })

    it('reads from top-level portolan:styles if not in properties', () => {
      const stac = {
        'portolan:styles': ['topLevel'],
        properties: {},
        assets: {
          topLevel: { title: 'Top Level', href: 'tl.json', getAbsoluteUrl: () => 'tl.json' }
        },
        getAbsoluteUrl: () => ''
      }
      const result = resolveStyles(stac)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('topLevel')
    })
  })

  describe('loadStyleJson', () => {
    it('fetches and validates style', async () => {
      const mockStyle = { version: 8, layers: [] }
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStyle)
      })

      const result = await loadStyleJson('https://example.com/style.json')
      expect(result).toEqual(mockStyle)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/style.json',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })

    it('throws on HTTP error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })

      await expect(loadStyleJson('https://example.com/missing.json'))
        .rejects.toThrow('Failed to fetch style: 404')
    })

    it('throws on invalid version', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ version: 7 })
      })

      await expect(loadStyleJson('https://example.com/old.json'))
        .rejects.toThrow('Invalid Mapbox GL style (version !== 8)')
    })
  })
})
