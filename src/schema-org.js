import Utils from './utils';
import STAC from './models/stac';

// ToDo: The URLs point often to the STAC metadata instead of the browserUrl
// should be changed so that the schema.org metadata is available at the urls

function addSpatialCoverage(schema, bbox) {
  if (Array.isArray(bbox) && bbox.length >= 4) {
    schema.spatialCoverage = {
      "@type": "Place",
      geo: {
        "@type": "GeoShape",
        box: (bbox || []).join(" ")
      }
    };
  }
}

function addAssets(schema, data) {
  if (Utils.size(data.assets) > 0) {
    schema.distribution = Object.values(data.assets).map(a => ({
      contentUrl: Utils.toAbsolute(a.href, data.getAbsoluteUrl()),
      fileFormat: a.type,
      name: a.title
    }));
  }
}

function formatTemporalCoverage(dates) {
  if (Array.isArray(dates) && dates.length === 2 && (typeof dates[0] === 'string' || typeof dates[1] === 'string')) {
    return dates.map(dt => dt ? dt : '..').join('/');
  }
  return null;
}

function createBaseSchema(data, type) {
  // ToDo: providers
  let name = STAC.getDisplayTitle(data);
  let stacUrl = data.getAbsoluteUrl();
  let url = window.location.toString();
  let inLanguage = data.getMetadata('language')?.code;
  let thumbnails = data.getThumbnails(true);
  let thumbnailUrl;
  if (thumbnails.length > 0) {
    thumbnailUrl = Utils.toAbsolute(thumbnails[0].href, data.getAbsoluteUrl());
  }
  let license = data.getMetadata('license');
  if (license && license !== 'proprietary' && license !== 'various') {
    license = `https://spdx.org/licenses/${license}.html`;
  }
  else {
    license = data.getLinkWithRel('license')?.href;
  }
  if (license) {
    license = Utils.toAbsolute(license, data.getAbsoluteUrl());
  }
  let fallbackDescription;
  if (data.isCatalogLike()) {
    fallbackDescription = `${name} STAC ${data.type}`;
  }
  else {
    fallbackDescription = `${name} STAC Item`;
  }

  return {
    // required
    "@context": "https://schema.org/",
    "@type": type,
    name,
    description: data.getMetadata("description") || fallbackDescription,
    // recommended
    citation: data.getMetadata("sci:citation"),
    identifier: data.getMetadata("sci:doi") || data.id,
    keywords: data.getMetadata("keywords"),
    license,
    url,
    isBasedOn: stacUrl,
    dateCreated: data.getMetadata('created'),
    dateModified: data.getMetadata('updated'),
    datePublished: data.getMetadata('published'),
    expires: data.getMetadata('expires'),
    inLanguage,
    thumbnailUrl,
    version: data.getMetadata('version'),
    image: thumbnailUrl
  };
}

export function createCatalogSchema(data, parents) {
  if (!(data instanceof STAC)) {
    return null;
  }

  let schema = createBaseSchema(data, 'DataCatalog', parents);

  if (data.isCollection()) {
    if (data.extent?.temporal?.interval.length > 0) {
      schema.temporalCoverage = formatTemporalCoverage(data.extent.temporal.interval[0]);
    }

    if (data.extent?.spatial?.bbox.length > 0) {
      addSpatialCoverage(schema, data.extent.spatial.bbox[0]);
    }
    addAssets(schema, data);
  }

  schema.hasPart = data.getStacLinksWithRel('child').map(link => ({
    "@type": "DataCatalog",
    name: link.title,
    url: Utils.toAbsolute(link.href, data.getAbsoluteUrl())
  }));
  schema.dataset = data.getStacLinksWithRel('item').map(link => ({
    name: link.title,
    url: Utils.toAbsolute(link.href, data.getAbsoluteUrl())
  }));
  schema.isPartOf = parents.filter(link => Boolean(link)).map(link => ({
    "@type": "DataCatalog",
    name: link.title,
    url: Utils.toAbsolute(link.href, data.getAbsoluteUrl())
  }));

  return schema;
}

export function createItemSchema(data, parents) {
  if (!(data instanceof STAC)) {
    return null;
  }

  let schema = createBaseSchema(data, 'Dataset', parents);
  schema.includedInDataCatalog = parents
    .filter(link => Boolean(link))
    .map(link => ({
      url: Utils.toAbsolute(link.href, data.getAbsoluteUrl())
    }));

  let start = data.getMetadata('start_datetime');
  let end = data.getMetadata('end_datetime');
  if (start || end) {
    schema.temporalCoverage = formatTemporalCoverage([start, end]);
  }
  else {
    schema.temporalCoverage = data.getMetadata('datetime');
  }

  addSpatialCoverage(schema, data.bbox);
  addAssets(schema, data);

  return schema;
}

export function addSchemaToDocument(doc, schema) {
  let id = 'schema-org';
  let element = doc.getElementById(id);
  if (!element) {
    element = doc.createElement('script');
    element.type = 'application/ld+json';
    element.id = id;
    doc.head.appendChild(element);
  }
  element.innerText = JSON.stringify(schema);
}