import Utils from './utils';
import STAC from './models/stac';
import URI from 'urijs';
import i18n from './i18n';

function toBrowserUrl(url, store) {
  let path = store.getters.toBrowserPath(url);
  let uri = URI(window.location.origin.toString());
  if (store.state.historyMode === 'hash') {
    uri.path(store.state.pathPrefix);
    uri.fragment(path);
  }
  else {
    uri.path(Utils.removeTrailingSlash(store.state.pathPrefix) + path);
  }
  return uri.toString();
}

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

function formatTemporalCoverage(dates) {
  if (Array.isArray(dates) && dates.length === 2 && (typeof dates[0] === 'string' || typeof dates[1] === 'string')) {
    return dates.map(dt => dt ? dt : '..').join('/');
  }
  return null;
}

function makeAssets(data) {
  if (Utils.size(data.assets) > 0) {
    return Object.values(data.assets).map(a => ({
      "@type": "DataDownload",
      contentUrl: Utils.toAbsolute(a.href, data.getAbsoluteUrl()),
      encodingFormat: a.type,
      name: a.title
    }));
  }
  return [];
}

function makeLinks(links, data, store, type = "DataCatalog") {
  return links.map(link => {
    let name, isBasedOn;
    if (link instanceof STAC) {
      name = STAC.getDisplayTitle(link);
      isBasedOn = link.getAbsoluteUrl();
    }
    else {
      name = link.title;
      isBasedOn = Utils.toAbsolute(link.href, data.getAbsoluteUrl());
    }
    let obj = {
      "@type": type,
      name,
      url: toBrowserUrl(isBasedOn, store),
      isBasedOn
    };
    if (type === 'Dataset') {
      obj.description = fallbackDescription(link, store);
    }
    return obj;
  });
}

function makeProvider(providers, role) {
  return providers
    .filter(p => Utils.isObject(p) && Array.isArray(p.roles) && p.roles.includes(role))
    .map(p => ({
      "@type": "Organization",
      "name": p.name,
      "description": p.description,
      "url": p.url,
      "email": p.email || p.mail,
    }));
}

function fallbackDescription(data, store) {
  let stacType, container;
  if (data instanceof STAC) {
    stacType = data.isItem() ? "Item" : data.type;
    container = data.collection;
  }
  else if (Utils.isObject(data) && data.rel === 'item') {
    stacType = "Item";
  }
  if (stacType) {
    let type = i18n.tc(`stac${stacType}`);
    let inX = i18n.t('in', {catalog: container || store.catalogTitle});
    return `SpatioTemporal Asset Catalog (STAC)\n${type} - ${data.id} ${inX}`;
  }
}

function createBaseSchema(data, type, store) {
  let name = STAC.getDisplayTitle(data);
  let stacUrl = data.getAbsoluteUrl();
  let url = toBrowserUrl(stacUrl, store);
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

  let providers = data.getMetadata('providers');
  let copyrightHolder; // licensor
  let producer; // producer
  let provider; // host
  let creator; // processor
  if (Utils.size(providers) > 0) {
    copyrightHolder = makeProvider(providers, "licensor");
    producer = makeProvider(providers, "producer");
    provider = makeProvider(providers, "host");
    creator = makeProvider(providers, "processor");
  }

  return {
    "@context": "https://schema.org/",
    "@type": type,
    name,
    description: data.getMetadata("description") || fallbackDescription(data, store),
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
    image: thumbnailUrl,
    copyrightHolder,
    producer,
    provider,
    creator
  };
}

export function createCatalogSchema(data, parents, store) {
  if (!(data instanceof STAC)) {
    return null;
  }
  // Remove invalid links
  parents = parents.filter(link => Utils.isObject(link));
  if (parents.length > 1) {
    // Remove duplicates
    parents = parents.filter((link, i) => parents.findIndex(p => p.isBasedOn === link.isBasedOn) !== i);
  }

  let schema = createBaseSchema(data, 'DataCatalog', store);

  if (data.isCollection()) {
    if (data.extent?.temporal?.interval.length > 0) {
      schema.temporalCoverage = formatTemporalCoverage(data.extent.temporal.interval[0]);
    }

    if (data.extent?.spatial?.bbox.length > 0) {
      addSpatialCoverage(schema, data.extent.spatial.bbox[0]);
    }
    schema.associatedMedia = makeAssets(data);
  }

  schema.hasPart = makeLinks(store.getters.catalogs, data, store);
  schema.dataset = makeLinks(store.getters.items, data, store, "Dataset");
  schema.isPartOf = makeLinks(parents, data, store);

  return schema;
}

export function createItemSchema(data, parents, store) {
  if (!(data instanceof STAC)) {
    return null;
  }
  parents = parents.filter(link => Utils.isObject(link));

  let schema = createBaseSchema(data, 'Dataset', store);

  schema.includedInDataCatalog = makeLinks(parents, data, store);

  let start = data.getMetadata('start_datetime');
  let end = data.getMetadata('end_datetime');
  if (start || end) {
    schema.temporalCoverage = formatTemporalCoverage([start, end]);
  }
  else {
    schema.temporalCoverage = data.getMetadata('datetime');
  }

  addSpatialCoverage(schema, data.bbox);
  schema.distribution = makeAssets(data);

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
