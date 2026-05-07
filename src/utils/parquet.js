import { asyncBufferFromUrl, parquetMetadataAsync, parquetRead, parquetSchema } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';

const PARQUET_MEDIA_TYPES = [
  'application/vnd.apache.parquet',
  'application/x-parquet'
];

const MAX_ROWS = 10000;

const WKB_TYPES = {
  0: 'Unknown',
  1: 'Point',
  2: 'LineString',
  3: 'Polygon',
  4: 'MultiPoint',
  5: 'MultiLineString',
  6: 'MultiPolygon',
  7: 'GeometryCollection',
};

export function isParquetAsset(asset) {
  return PARQUET_MEDIA_TYPES.includes(asset.type);
}

export function findParquetAssets(assets) {
  return assets.filter(isParquetAsset);
}

function parseGeoMetadata(metadata) {
  if (!metadata.key_value_metadata) {
    return null;
  }
  const geoEntry = metadata.key_value_metadata.find(kv => kv.key === 'geo');
  if (!geoEntry) {
    return null;
  }
  try {
    return JSON.parse(geoEntry.value);
  } catch {
    return null;
  }
}

function detectGeometryInfo(metadata, columnNames) {
  const geo = parseGeoMetadata(metadata);
  if (geo) {
    const primaryColumn = geo.primary_column || 'geometry';
    const columnMeta = geo.columns?.[primaryColumn];
    let bboxMapping = null;

    if (columnMeta?.covering?.bbox) {
      const cb = columnMeta.covering.bbox;
      bboxMapping = {
        xmin: cb.xmin?.[0] ? `${cb.xmin[0]}.${cb.xmin[1]}` : null,
        ymin: cb.ymin?.[0] ? `${cb.ymin[0]}.${cb.ymin[1]}` : null,
        xmax: cb.xmax?.[0] ? `${cb.xmax[0]}.${cb.xmax[1]}` : null,
        ymax: cb.ymax?.[0] ? `${cb.ymax[0]}.${cb.ymax[1]}` : null,
      };
      if (Object.values(bboxMapping).some(v => !v)) {
        bboxMapping = null;
      }
    }

    let crs = 'EPSG:4326';
    let crsDefinition = null;
    if (columnMeta?.crs) {
      const projjson = columnMeta.crs;
      const auth = projjson.id?.authority;
      const code = projjson.id?.code;
      if (auth && code) {
        crs = `${auth}:${code}`;
      }
      if (crs !== 'EPSG:4326' && crs !== 'EPSG:3857') {
        crsDefinition = projjson;
      }
    }

    return {
      geometryColumn: primaryColumn,
      bboxMapping,
      crs,
      crsDefinition,
    };
  }

  const geomCol = columnNames.find(n => n === 'geometry' || n === 'geom');
  return geomCol ? { geometryColumn: geomCol, bboxMapping: null, crs: 'EPSG:4326', crsDefinition: null } : null;
}

function detectBboxColumns(columnNames) {
  const patterns = [
    { xmin: 'xmin', ymin: 'ymin', xmax: 'xmax', ymax: 'ymax' },
    { xmin: 'bbox_xmin', ymin: 'bbox_ymin', xmax: 'bbox_xmax', ymax: 'bbox_ymax' },
    { xmin: 'minx', ymin: 'miny', xmax: 'maxx', ymax: 'maxy' },
  ];
  for (const pattern of patterns) {
    if (Object.values(pattern).every(name => columnNames.includes(name))) {
      return pattern;
    }
  }
  return null;
}

export function parseWkbType(buffer) {
  if (!buffer || buffer.byteLength < 5) {
    return 'Unknown';
  }
  const view = buffer instanceof DataView ? buffer : new DataView(
    buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength
  );
  const byteOrder = view.getUint8(0);
  const littleEndian = byteOrder === 1;
  let typeId = view.getUint32(1, littleEndian);
  typeId = typeId % 1000;
  return WKB_TYPES[typeId] || 'Unknown';
}

export function bboxFromWkb(buffer) {
  if (!buffer || buffer.byteLength < 21) {
    return null;
  }
  try {
    const view = buffer instanceof DataView ? buffer : new DataView(
      buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength
    );
    const littleEndian = view.getUint8(0) === 1;
    let typeId = view.getUint32(1, littleEndian);
    const hasZ = typeId >= 1000 && typeId < 2000;
    typeId = typeId % 1000;
    const coordSize = hasZ ? 24 : 16;
    let offset = 5;
    let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;

    function readCoord() {
      const x = view.getFloat64(offset, littleEndian);
      const y = view.getFloat64(offset + 8, littleEndian);
      offset += coordSize;
      if (x < xmin) {xmin = x;}
      if (x > xmax) {xmax = x;}
      if (y < ymin) {ymin = y;}
      if (y > ymax) {ymax = y;}
    }

    function readLinearRing() {
      const numPoints = view.getUint32(offset, littleEndian);
      offset += 4;
      for (let i = 0; i < numPoints; i++) {readCoord();}
    }

    if (typeId === 1) {
      readCoord();
    } else if (typeId === 2) {
      readLinearRing();
    } else if (typeId === 3) {
      const numRings = view.getUint32(offset, littleEndian);
      offset += 4;
      for (let i = 0; i < numRings; i++) {readLinearRing();}
    } else if (typeId === 4 || typeId === 5 || typeId === 6) {
      const numGeoms = view.getUint32(offset, littleEndian);
      offset += 4;
      for (let i = 0; i < numGeoms; i++) {
        const subBo = view.getUint8(offset);
        const subLe = subBo === 1;
        let subType = view.getUint32(offset + 1, subLe);
        const subHasZ = subType >= 1000 && subType < 2000;
        subType = subType % 1000;
        const subCoordSize = subHasZ ? 24 : 16;
        offset += 5;
        if (subType === 1) {
          const x = view.getFloat64(offset, subLe);
          const y = view.getFloat64(offset + 8, subLe);
          offset += subCoordSize;
          if (x < xmin) {xmin = x;}
          if (x > xmax) {xmax = x;}
          if (y < ymin) {ymin = y;}
          if (y > ymax) {ymax = y;}
        } else if (subType === 2) {
          const n = view.getUint32(offset, subLe);
          offset += 4;
          for (let j = 0; j < n; j++) {
            const x = view.getFloat64(offset, subLe);
            const y = view.getFloat64(offset + 8, subLe);
            offset += subCoordSize;
            if (x < xmin) {xmin = x;}
            if (x > xmax) {xmax = x;}
            if (y < ymin) {ymin = y;}
            if (y > ymax) {ymax = y;}
          }
        } else if (subType === 3) {
          const numRings = view.getUint32(offset, subLe);
          offset += 4;
          for (let r = 0; r < numRings; r++) {
            const n = view.getUint32(offset, subLe);
            offset += 4;
            for (let j = 0; j < n; j++) {
              const x = view.getFloat64(offset, subLe);
              const y = view.getFloat64(offset + 8, subLe);
              offset += subCoordSize;
              if (x < xmin) {xmin = x;}
              if (x > xmax) {xmax = x;}
              if (y < ymin) {ymin = y;}
              if (y > ymax) {ymax = y;}
            }
          }
        }
      }
    } else {
      return null;
    }

    if (xmin === Infinity) {return null;}
    return [xmin, ymin, xmax, ymax];
  } catch {
    return null;
  }
}

export async function loadParquetMetadata(url) {
  const file = await asyncBufferFromUrl({ url });
  const metadata = await parquetMetadataAsync(file);
  const schema = parquetSchema(metadata);
  const columnNames = schema.children.map(e => e.element.name);
  const totalRows = Number(metadata.num_rows);
  const geoInfo = detectGeometryInfo(metadata, columnNames);
  const standaloneBbox = geoInfo?.bboxMapping || detectBboxColumns(columnNames);

  return {
    file,
    metadata,
    columnNames,
    totalRows,
    geometryColumn: geoInfo?.geometryColumn || null,
    bboxMapping: standaloneBbox,
    crs: geoInfo?.crs || null,
    crsDefinition: geoInfo?.crsDefinition || null,
  };
}

export async function loadParquetRows(file, metadata, columnNames, geometryColumn) {
  const totalRows = Number(metadata.num_rows);
  const rowEnd = Math.min(totalRows, MAX_ROWS);
  const columnsToRead = columnNames.filter(n => n !== geometryColumn);

  return new Promise((resolve, reject) => {
    parquetRead({
      file,
      metadata,
      compressors,
      columns: columnsToRead,
      rowStart: 0,
      rowEnd,
      onComplete: rows => resolve({
        rows,
        loadedRows: rowEnd,
        totalRows,
        columns: columnsToRead,
      }),
    }).catch(reject);
  });
}

export async function loadGeometryTypesForRows(file, metadata, geometryColumn, rowEnd) {
  if (!geometryColumn) {return [];}
  return new Promise((resolve, reject) => {
    parquetRead({
      file,
      metadata,
      compressors,
      columns: [geometryColumn],
      rowStart: 0,
      rowEnd,
      onComplete: rows => {
        const types = rows.map(row => {
          const geomValue = row[0];
          if (geomValue instanceof Uint8Array || geomValue instanceof ArrayBuffer) {
            return parseWkbType(geomValue);
          }
          return 'Unknown';
        });
        resolve(types);
      },
    }).catch(reject);
  });
}

export async function getBboxForRow(file, metadata, geometryColumn, rowIndex) {
  return new Promise((resolve, reject) => {
    parquetRead({
      file,
      metadata,
      compressors,
      columns: [geometryColumn],
      rowStart: rowIndex,
      rowEnd: rowIndex + 1,
      onComplete: rows => {
        if (rows.length === 0) {
          resolve(null);
          return;
        }
        const geomValue = rows[0][0];
        if (geomValue instanceof Uint8Array || geomValue instanceof ArrayBuffer) {
          resolve(bboxFromWkb(geomValue));
        } else {
          resolve(null);
        }
      },
    }).catch(reject);
  });
}

export { MAX_ROWS };
