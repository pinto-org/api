// Unmapped properties will pass through directly
const standardMapping = {
  blockNumber: parseInt,
  timestamp: (p) => {
    // Convert to seconds if its provided in ms
    if (p.length >= 13) {
      return parseInt(p) / 1000;
    }
    return parseInt(p);
  },
  limit: parseInt,
  start_time: (p) => new Date(p),
  end_time: (p) => new Date(p),
  addresses: (p) => p.split(','),
  snapshot: parseInt
};

class RestParsingUtil {
  static parseQuery(query, parseMapping = standardMapping) {
    const retval = {};
    for (const property in query) {
      retval[property] = parseMapping[property]?.call(null, query[property]) ?? query[property];
    }
    return retval;
  }

  // Returns true if the only defined properties on object are the given properties.
  static onlyHasProperties(object, properties) {
    const definedProperties = Object.keys(object);
    return definedProperties.length === properties.length && definedProperties.every((op) => properties.includes(op));
  }

  static dateRangeValidation(dateRange) {
    if (dateRange) {
      if (
        !Array.isArray(dateRange) ||
        dateRange.length !== 2 ||
        !(dateRange[0] instanceof Date) ||
        !(dateRange[1] instanceof Date) ||
        dateRange[1] <= dateRange[0]
      ) {
        throw new InputError('Invalid date range provided. Must be array of 2 dates with end date after start date.');
      }
    }
  }

  static numberRangeValidation(numberRange) {
    if (numberRange) {
      if (
        !Array.isArray(numberRange) ||
        numberRange.length !== 2 ||
        typeof numberRange[0] !== 'number' ||
        typeof numberRange[1] !== 'number' ||
        numberRange[1] <= numberRange[0]
      ) {
        throw new InputError('Invalid seasons range provided.');
      }
    }
  }
}

module.exports = RestParsingUtil;
