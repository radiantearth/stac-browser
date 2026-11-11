// `queryables` are the item properties each label table names (used by ItemFilters.vue);
// standard-year calls its variable property `variable` instead of `variable_id`
export const EXTRA_FIELD_TABLES = [
  { key: 'caladapt:variable_labels', heading: 'Variables', nameLabel: 'Variable', queryables: ['variable_id', 'variable'] },
  { key: 'caladapt:station_labels', heading: 'Locations', nameLabel: 'Station', queryables: ['location'] },
  { key: 'caladapt:boundary_labels', heading: 'Boundaries', nameLabel: 'Boundary', queryables: ['boundary'] },
];

export const QUERYABLE_TABLES = {
  'time_period': {
    heading: 'Time periods',
    nameLabel: 'Time period',
    values: {
      'present-day': 'Present Day (1.2°C)',
      'near-future': 'Near-Future (1.5°C)',
      'mid-century': 'Mid-Century (2.0°C)',
      'mid-late-century': 'Mid-Late-Century (2.5°C)',
      'historical': 'Historical Period (1981–2019)',
      'time-based': 'Time-based (2015–2055)'
    }
  }
};

export const QUERYABLE_TEXT = {
  'cmip6:grid_label': {
    label: 'Spatial resolution',
    nameLabel: 'Spatial resolution',
    values: { d01: '45 km', d02: '9 km', d03: '3 km' }
  },
  'cmip6:table_id': {
    label: 'Temporal frequency',
    nameLabel: 'Temporal frequency',
    values: { '1hr': 'Hourly', day: 'Daily', mon: 'Monthly', gwl: 'Global warming levels', yrmax: 'Yearly Max' }
  },
  'cmip6:experiment_id': {
    label: 'Scenarios',
    nameLabel: 'Scenario',
    values: { historical: 'Historical', ssp245: 'SSP2-4.5', ssp370: 'SSP3-7.0', ssp585: 'SSP5-8.5', reanalysis: 'Reanalysis' }
  },
  'percentile': {
    label: 'Percentiles',
    nameLabel: 'Percentile',
    values: { '5ptile': '5th percentile', '50ptile': '50th percentile (median)', '95ptile': '95th percentile' }
  }
};
