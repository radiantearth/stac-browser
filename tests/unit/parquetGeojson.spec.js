import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock hyparquet so loadGeoJsonFromParquet can be exercised without network
// or real parquet files. Kept in a separate spec file from parquet.spec.js,
// which tests against the real (unmocked) module.
vi.mock('hyparquet', () => ({
  asyncBufferFromUrl: vi.fn(),
  parquetMetadataAsync: vi.fn(),
  parquetRead: vi.fn(),
  parquetSchema: vi.fn(),
}))
vi.mock('hyparquet-compressors', () => ({ compressors: {} }))

import { asyncBufferFromUrl, parquetMetadataAsync, parquetRead, parquetSchema } from 'hyparquet'
import {
  loadGeoJsonFromParquet,
  loadGeometryTypesForRows,
  getBboxForRow,
  bboxFromGeoJson,
  MAX_MAP_FEATURES,
} from '../../src/utils/parquet.js'

const POLYGON = {
  type: 'Polygon',
  coordinates: [[[-71.1, 42.2], [-70.9, 42.2], [-70.9, 42.4], [-71.1, 42.2]]],
}

// Wires the hyparquet mocks so that loadParquetMetadata sees a GeoParquet
// file with a `geometry` column, `numRows` rows, and (optionally) a CRS, and
// parquetRead delivers `rows` in whatever format the caller asked for.
function mockParquetFile({ numRows, rows = [], crs = null, geo = true, columns = ['geometry', 'name'] }) {
  const geoMeta = {
    primary_column: 'geometry',
    columns: { geometry: crs ? { crs } : {} },
  }
  const metadata = {
    num_rows: BigInt(numRows),
    key_value_metadata: geo ? [{ key: 'geo', value: JSON.stringify(geoMeta) }] : [],
  }
  asyncBufferFromUrl.mockResolvedValue({ byteLength: 1000 })
  parquetMetadataAsync.mockResolvedValue(metadata)
  parquetSchema.mockReturnValue({ children: columns.map(name => ({ element: { name } })) })
  parquetRead.mockImplementation(async (opts) => { opts.onComplete(rows) })
}

describe('loadGeoJsonFromParquet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns exceeded without reading data when over the cap', async () => {
    mockParquetFile({ numRows: MAX_MAP_FEATURES + 1 })
    const result = await loadGeoJsonFromParquet('https://example.com/big.parquet')
    expect(result).toEqual({ exceeded: true, totalRows: MAX_MAP_FEATURES + 1 })
    expect(parquetRead).not.toHaveBeenCalled()
  })

  it('respects a custom maxFeatures option', async () => {
    mockParquetFile({ numRows: 50 })
    const result = await loadGeoJsonFromParquet('https://example.com/data.parquet', { maxFeatures: 10 })
    expect(result.exceeded).toBe(true)
    expect(parquetRead).not.toHaveBeenCalled()
  })

  it('builds a FeatureCollection with properties minus the geometry column', async () => {
    mockParquetFile({
      numRows: 2,
      rows: [
        { geometry: POLYGON, name: 'a', acres: 1.5 },
        { geometry: POLYGON, name: 'b', acres: 2.5 },
      ],
    })
    const result = await loadGeoJsonFromParquet('https://example.com/data.parquet')
    expect(result.exceeded).toBe(false)
    expect(result.totalRows).toBe(2)
    expect(result.featureCollection.type).toBe('FeatureCollection')
    expect(result.featureCollection.features).toHaveLength(2)
    expect(result.featureCollection.features[0]).toEqual({
      type: 'Feature',
      geometry: POLYGON,
      properties: { name: 'a', acres: 1.5 },
    })
  })

  it('skips rows with null geometry', async () => {
    mockParquetFile({
      numRows: 2,
      rows: [
        { geometry: null, name: 'a' },
        { geometry: POLYGON, name: 'b' },
      ],
    })
    const result = await loadGeoJsonFromParquet('https://example.com/data.parquet')
    expect(result.featureCollection.features).toHaveLength(1)
    expect(result.featureCollection.features[0].properties.name).toBe('b')
  })

  it('sanitizes BigInt properties for MapLibre', async () => {
    mockParquetFile({
      numRows: 1,
      rows: [{ geometry: POLYGON, id: 42n, huge: 2n ** 60n }],
      columns: ['geometry', 'id', 'huge'],
    })
    const result = await loadGeoJsonFromParquet('https://example.com/data.parquet')
    const props = result.featureCollection.features[0].properties
    expect(props.id).toBe(42)
    expect(props.huge).toBe((2n ** 60n).toString())
  })

  it('throws when the geometry column was not decoded (raw WKB bytes)', async () => {
    mockParquetFile({
      numRows: 1,
      rows: [{ geometry: new Uint8Array([1, 2, 3]), name: 'a' }],
    })
    await expect(loadGeoJsonFromParquet('https://example.com/data.parquet'))
      .rejects.toThrow(/not decoded/)
  })

  it('throws for a CRS the map cannot display', async () => {
    mockParquetFile({
      numRows: 1,
      crs: { id: { authority: 'EPSG', code: 2249 } },
    })
    await expect(loadGeoJsonFromParquet('https://example.com/data.parquet'))
      .rejects.toThrow(/EPSG:2249/)
  })

  it('accepts the OGC:CRS84 CRS', async () => {
    mockParquetFile({
      numRows: 1,
      rows: [{ geometry: POLYGON, name: 'a' }],
      crs: { id: { authority: 'OGC', code: 'CRS84' } },
    })
    const result = await loadGeoJsonFromParquet('https://example.com/data.parquet')
    expect(result.featureCollection.features).toHaveLength(1)
  })

  it('throws when the file has no geometry column', async () => {
    mockParquetFile({ numRows: 1, geo: false, columns: ['name', 'value'] })
    await expect(loadGeoJsonFromParquet('https://example.com/data.parquet'))
      .rejects.toThrow(/no geometry column/)
  })
})

describe('decoded-GeoJSON geometry handling (hyparquet >= 1.25)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadGeometryTypesForRows reads the type from decoded geometry objects', async () => {
    parquetRead.mockImplementation(async (opts) => {
      opts.onComplete([[{ type: 'MultiPolygon', coordinates: [] }], [null]])
    })
    const types = await loadGeometryTypesForRows({}, {}, 'geometry', 2)
    expect(types).toEqual(['MultiPolygon', 'Unknown'])
  })

  it('getBboxForRow computes the bbox from a decoded geometry object', async () => {
    parquetRead.mockImplementation(async (opts) => {
      opts.onComplete([[POLYGON]])
    })
    const bbox = await getBboxForRow({}, {}, 'geometry', 0)
    expect(bbox).toEqual([-71.1, 42.2, -70.9, 42.4])
  })
})

describe('bboxFromGeoJson', () => {
  it('computes the bbox of a point', () => {
    expect(bboxFromGeoJson({ type: 'Point', coordinates: [5, 10] })).toEqual([5, 10, 5, 10])
  })

  it('computes the bbox of nested multi-geometries', () => {
    const multi = {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [2, 0], [2, 2], [0, 0]]],
        [[[-1, -1], [1, -1], [1, 1], [-1, -1]]],
      ],
    }
    expect(bboxFromGeoJson(multi)).toEqual([-1, -1, 2, 2])
  })

  it('returns null for missing or empty geometry', () => {
    expect(bboxFromGeoJson(null)).toBeNull()
    expect(bboxFromGeoJson({ type: 'Point' })).toBeNull()
    expect(bboxFromGeoJson({ type: 'MultiPolygon', coordinates: [] })).toBeNull()
  })
})
