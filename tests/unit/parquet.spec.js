import { describe, it, expect } from 'vitest'
import { isParquetAsset, findParquetAssets, parseWkbType, bboxFromWkb } from '../../src/utils/parquet.js'

describe('parquet utilities', () => {
  describe('isParquetAsset', () => {
    it('returns true for apache parquet type', () => {
      expect(isParquetAsset({ type: 'application/vnd.apache.parquet' })).toBe(true)
    })

    it('returns true for x-parquet type', () => {
      expect(isParquetAsset({ type: 'application/x-parquet' })).toBe(true)
    })

    it('returns false for other types', () => {
      expect(isParquetAsset({ type: 'application/json' })).toBe(false)
      expect(isParquetAsset({ type: 'image/tiff' })).toBe(false)
    })

    it('returns false for missing type', () => {
      expect(isParquetAsset({})).toBe(false)
    })
  })

  describe('findParquetAssets', () => {
    it('filters parquet assets from array', () => {
      const assets = [
        { type: 'application/vnd.apache.parquet', href: 'data.parquet' },
        { type: 'application/json', href: 'metadata.json' },
        { type: 'application/x-parquet', href: 'other.parquet' },
      ]
      const result = findParquetAssets(assets)
      expect(result).toHaveLength(2)
      expect(result[0].href).toBe('data.parquet')
      expect(result[1].href).toBe('other.parquet')
    })

    it('returns empty array when no parquet assets', () => {
      const assets = [{ type: 'image/png', href: 'image.png' }]
      expect(findParquetAssets(assets)).toEqual([])
    })
  })

  describe('parseWkbType', () => {
    it('returns Unknown for null/undefined', () => {
      expect(parseWkbType(null)).toBe('Unknown')
      expect(parseWkbType(undefined)).toBe('Unknown')
    })

    it('returns Unknown for buffer too small', () => {
      expect(parseWkbType(new Uint8Array([1, 2, 3]))).toBe('Unknown')
    })

    it('parses Point (type 1) little-endian', () => {
      // WKB: 01 (little-endian) + 01000000 (type 1 = Point)
      const buffer = new Uint8Array([
        0x01, // little-endian
        0x01, 0x00, 0x00, 0x00, // type 1
        // coordinates would follow but not needed for type detection
      ])
      expect(parseWkbType(buffer)).toBe('Point')
    })

    it('parses Point (type 1) big-endian', () => {
      const buffer = new Uint8Array([
        0x00, // big-endian
        0x00, 0x00, 0x00, 0x01, // type 1
      ])
      expect(parseWkbType(buffer)).toBe('Point')
    })

    it('parses LineString (type 2)', () => {
      const buffer = new Uint8Array([
        0x01, // little-endian
        0x02, 0x00, 0x00, 0x00, // type 2
      ])
      expect(parseWkbType(buffer)).toBe('LineString')
    })

    it('parses Polygon (type 3)', () => {
      const buffer = new Uint8Array([
        0x01, // little-endian
        0x03, 0x00, 0x00, 0x00, // type 3
      ])
      expect(parseWkbType(buffer)).toBe('Polygon')
    })

    it('parses MultiPoint (type 4)', () => {
      const buffer = new Uint8Array([
        0x01,
        0x04, 0x00, 0x00, 0x00,
      ])
      expect(parseWkbType(buffer)).toBe('MultiPoint')
    })

    it('parses MultiLineString (type 5)', () => {
      const buffer = new Uint8Array([
        0x01,
        0x05, 0x00, 0x00, 0x00,
      ])
      expect(parseWkbType(buffer)).toBe('MultiLineString')
    })

    it('parses MultiPolygon (type 6)', () => {
      const buffer = new Uint8Array([
        0x01,
        0x06, 0x00, 0x00, 0x00,
      ])
      expect(parseWkbType(buffer)).toBe('MultiPolygon')
    })

    it('handles 3D types (1000 + base type)', () => {
      // WKB 3D Point = 1001
      const buffer = new Uint8Array([
        0x01, // little-endian
        0xe9, 0x03, 0x00, 0x00, // 1001 in little-endian
      ])
      expect(parseWkbType(buffer)).toBe('Point')
    })
  })

  describe('bboxFromWkb', () => {
    it('returns null for null/undefined', () => {
      expect(bboxFromWkb(null)).toBeNull()
      expect(bboxFromWkb(undefined)).toBeNull()
    })

    it('returns null for buffer too small', () => {
      expect(bboxFromWkb(new Uint8Array(10))).toBeNull()
    })

    it('extracts bbox from Point', () => {
      // WKB Point at (10.5, 20.5)
      const buffer = new ArrayBuffer(21)
      const view = new DataView(buffer)
      view.setUint8(0, 1) // little-endian
      view.setUint32(1, 1, true) // Point type
      view.setFloat64(5, 10.5, true) // x
      view.setFloat64(13, 20.5, true) // y

      const bbox = bboxFromWkb(new Uint8Array(buffer))
      expect(bbox).toEqual([10.5, 20.5, 10.5, 20.5])
    })

    it('extracts bbox from LineString', () => {
      // WKB LineString with 2 points: (0, 0) and (10, 20)
      const buffer = new ArrayBuffer(41)
      const view = new DataView(buffer)
      view.setUint8(0, 1) // little-endian
      view.setUint32(1, 2, true) // LineString type
      view.setUint32(5, 2, true) // 2 points
      // Point 1
      view.setFloat64(9, 0, true)
      view.setFloat64(17, 0, true)
      // Point 2
      view.setFloat64(25, 10, true)
      view.setFloat64(33, 20, true)

      const bbox = bboxFromWkb(new Uint8Array(buffer))
      expect(bbox).toEqual([0, 0, 10, 20])
    })

    it('extracts bbox from Polygon', () => {
      // Simple square polygon (0,0), (10,0), (10,10), (0,10), (0,0)
      const buffer = new ArrayBuffer(93)
      const view = new DataView(buffer)
      view.setUint8(0, 1) // little-endian
      view.setUint32(1, 3, true) // Polygon type
      view.setUint32(5, 1, true) // 1 ring
      view.setUint32(9, 5, true) // 5 points in ring

      let offset = 13
      const points = [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]
      for (const [x, y] of points) {
        view.setFloat64(offset, x, true)
        view.setFloat64(offset + 8, y, true)
        offset += 16
      }

      const bbox = bboxFromWkb(new Uint8Array(buffer))
      expect(bbox).toEqual([0, 0, 10, 10])
    })
  })
})
