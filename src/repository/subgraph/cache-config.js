// Must be List queries that dont require explicitly provided id (in subgraph framework, usually ending in 's')
const SG_CACHE_CONFIG = {
  cache_siloHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'siloHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    },
    omitFields: ['silo']
  },
  cache_fieldHourlySnapshots: {
    subgraph: 'pintostalk',
    queryName: 'fieldHourlySnapshots',
    client: (c) => c.SG.BEANSTALK,
    paginationSettings: {
      field: 'season',
      lastValue: 0,
      direction: 'asc'
    },
    omitFields: ['field']
  }
};

module.exports = { SG_CACHE_CONFIG };
