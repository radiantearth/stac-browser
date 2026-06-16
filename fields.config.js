import { Registry } from '@radiantearth/stac-fields';

// For details, please consult
// https://github.com/radiantearth/stac-browser/blob/main/docs/metadata.md

// ADD ADDITIONAL FIELDS AND EXTENSIONS HERE

Registry.addExtension('eopf', 'ESA EO Processing Framework');
Registry.addMetadataField('eopf:datastrip_id', {
  label: 'Datastrip ID'
});
Registry.addMetadataField('eopf:datatake_id', {
  label: 'Datatake ID'
});
Registry.addMetadataField('eopf:instrument_configuration_id', {
  label: 'Instrument Configuration ID'
});
Registry.addMetadataField('eopf:origin_datetime', {
  label: 'Origin Time',
  format: 'Timestamp'
});
Registry.addMetadataField('statistics', {
  label: 'Statistics',
  properties: {
    mean: 'Average',
    maximum: {
      label: 'Max.',
      explain: 'Maxmimum value'
    },
    minimum: {
      label: 'Min.',
      explain: 'Minimum value'
    },
    stdev: {
      label: 'Std. Dev.',
      explain: 'Standard Deviation'
    },
    count: {
      label: 'Count',
      explain: 'Total number of values'
    },
    valid_percent: {
      label: 'Valid',
      explain: 'Percentage of valid values',
      unit: '%'
    },
    water: {
      label: 'Water',
      explain: 'Coverage of water bodies',
      unit: '%'
    },
    nodata: {
      label: 'No Data',
      explain: 'Percentage of the image with no data',
      unit: '%'
    },
    saturated_defective: {
      label: 'Saturated/Defective',
      explain: 'Percentage of the image that is either saturated or defective',
      unit: '%'
    },
    unclassified: {
      label: 'Unclassified',
      explain: 'Percentage of the image that is not classified',
      unit: '%'
    },
    dark_area: {
      label: 'Dark Area',
      explain: 'Percentage of the image with dark areas',
      unit: '%'
    },
    vegetation: {
      label: 'Vegetation',
      explain: 'Coverage of vegetated areas',
      unit: '%'
    },
    not_vegetated: {
      label: 'Not Vegetated',
      explain: 'Coverage of non-vegetated areas',
      unit: '%'
    },
    thin_cirrus: {
      label: 'Thin Cirrus',
      explain: 'Coverage of thin cirrus clouds',
      unit: '%'
    },
    cloud_shadow: {
      label: 'Cloud Shadow',
      explain: 'Coverage of cloud shadows',
      unit: '%'
    },
    high_proba_clouds: {
      label: 'Clouds (high prob.)',
      explain: 'Coverage of clouds with high probability',
      unit: '%'
    },
    medium_proba_clouds: {
      label: 'Cloud (med. prob.)',
      explain: 'Coverage of clouds with medium probability',
      unit: '%'
    }
  }
});

// DEFINE FIELDS TO IGNORE IN METADATA RENDERING

/**
 * Function that can be used to change the ignored fields in the metadata rendering.
 * 
 * @type {function|null}
 * @param {STACObject|Object} object The entity for which the metadata is rendered.
 * @param {string[]} fields The fields ignored by default.
 * @param {string} type The type of the entity (e.g. `CatalogLike`, `Item`, `Asset`, `Link`, `Provider`).
 * @returns {string[]} The fields to ignore in the metadata rendering.
 */
const ignoreMetadata = null;

export { ignoreMetadata };
