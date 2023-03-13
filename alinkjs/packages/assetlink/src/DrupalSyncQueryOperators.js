import { SyncQueryOperators } from '@orbit/record-cache';
import { QueryExpressionParseError } from '@orbit/data';
import { RecordNotFoundException } from '@orbit/records';
import { deepGet, isNone } from '@orbit/utils';
import { DateTimeSerializer } from '@orbit/serializers';


// Based on https://github.com/orbitjs/orbit/blob/2c4bf7038d2f74ba31e45e949c70ec4161ced28f/packages/@orbit/record-cache/src/operators/sync-query-operators.ts
export default {
  findRecord: SyncQueryOperators.findRecord,
  findRelatedRecord: SyncQueryOperators.findRelatedRecord,

  findRecords(
      cache,
      expression,
      // eslint-disable-next-line no-unused-vars
      options
    ) {
      let exp = expression;
      let results = cache.getRecordsSync(exp.records || exp.type);
      if (exp.filter) {
        results = filterRecords(cache.schema, results, exp.filter);
      }
      if (exp.sort) {
        results = sortRecords(results, exp.sort);
      }
      if (exp.page) {
        results = paginateRecords(results, exp.page);
      }
      return results;
  },

  findRelatedRecords(
      cache,
      expression,
      options
    ) {
      const exp = expression;
      const { record, relationship } = exp;
      const relatedIds = cache.getRelatedRecordsSync(record, relationship);
      if (!relatedIds || relatedIds.length === 0) {
        if (!cache.getRecordSync(record)) {
          if (options?.raiseNotFoundExceptions) {
            throw new RecordNotFoundException(record.type, record.id);
          } else {
            return undefined;
          }
        }

        return [];
      }
      let results = cache.getRecordsSync(relatedIds);

      if (exp.filter) {
        results = filterRecords(results, exp.filter);
      }
      if (exp.sort) {
        results = sortRecords(results, exp.sort);
      }
      if (exp.page) {
        results = paginateRecords(results, exp.page);
      }
      return results;
  },
}

function filterRecords(schemas, records, filters) {
  return records.filter((record) => {
    const recordModel = schemas.models[record.type] || {};

    for (let i = 0, l = filters.length; i < l; i++) {
      if (!applyFilter(recordModel, record, filters[i])) {
        return false;
      }
    }
    return true;
  });
}

function applyFilter(recordModel, record, filter) {
  if (filter.kind === 'group') {

    // Map from the operator to the Array function used to combine the sub filters
    let opFn = undefined
    if (filter.op === 'AND') {
      opFn = 'every';
    } else if (filter.op === 'OR') {
      opFn = 'some';
    } else {
      throw new QueryExpressionParseError(`Filter group operation ${filter.op} is not valid.`);
    }

    const filters = filter.filter;

    // Vacuously truthy case for empty filter groups
    if (!filters?.length) {
      return true;
    }

    // Recursively apply our filter group
    return filters[opFn](subFilter => {
      return applyFilter(recordModel, record, subFilter);
    });
  }

  if (filter.kind === 'attribute') {
    let attributeKey = filter.attribute.split('.');

    const attributeModel = deepGet(recordModel || {}, ['attributes', ...attributeKey]) || {};

    let actual;
    if (filter.attribute === 'id') {
      actual = record.id;
    } else {
      actual = deepGet(record, ['attributes', ...attributeKey]);
    }

    let expected = filter.value;

    // We can probably stop doing this - and sending epoch filters - once https://www.drupal.org/project/drupal/issues/3260025 is done
    if (attributeModel.type === 'string' && attributeModel.format === 'date-time' && actual && typeof expected === 'number') {
      actual = new DateTimeSerializer().deserialize(actual).getTime() / 1000;
    }

    // https://api.drupal.org/api/drupal/core%21modules%21jsonapi%21src%21Query%21EntityCondition.php/property/EntityCondition%3A%3AallowedOperators/9.4.x
    switch (filter.op) {
      case 'equal':
      case '=':
        if (Array.isArray(actual)) {
          return actual.some(a => {
            if (typeof a === 'string' && typeof expected === 'string') {
              return a.toLowerCase().startsWith(expected.toLowerCase());
            }
            return a === expected;
          });
        }
        if (typeof actual === 'string') {
          return actual.toLowerCase() === expected.toLowerCase();
        }
        return actual === expected;
      case '<>':
        if (Array.isArray(actual)) {
          return !actual.some(a => {
            if (typeof a === 'string' && typeof expected === 'string') {
              return a.toLowerCase().startsWith(expected.toLowerCase());
            }
            return a === expected;
          });
        }
        if (typeof actual === 'string') {
          return actual.toLowerCase() !== expected.toLowerCase();
        }
        return actual !== expected;
      case '>':
        return actual > expected;
      case '>=':
        return actual >= expected;
      case '<':
        return actual < expected;
      case '<=':
        return actual <= expected;
      case 'STARTS_WITH':
        if (Array.isArray(actual)) {
          return actual.some(a => {
            return typeof a === 'string' && typeof expected === 'string' &&
              a.toLowerCase().startsWith(expected.toLowerCase());
          });
        }
        return typeof actual === 'string' && typeof expected === 'string' &&
          actual.toLowerCase().startsWith(expected.toLowerCase());
      case 'CONTAINS':
        if (Array.isArray(actual)) {
          return actual.some(a => {
            return typeof a === 'string' && typeof expected === 'string' &&
              a.toLowerCase().includes(expected.toLowerCase());
          });
        }
        return typeof actual === 'string' && typeof expected === 'string' &&
          actual.toLowerCase().includes(expected.toLowerCase());
      case 'ENDS_WITH':
        if (Array.isArray(actual)) {
          return actual.some(a => {
            return typeof a === 'string' && typeof expected === 'string' &&
              a.toLowerCase().endsWith(expected.toLowerCase());
          });
        }
        return typeof actual === 'string' && typeof expected === 'string' &&
          actual.toLowerCase().endsWith(expected.toLowerCase());
      case 'IN':
        if (Array.isArray(actual) && Array.isArray(expected)) {
          return expected.some(e =>
            actual.some(a => {
              if (typeof a === 'string' && typeof e === 'string') {
                return a.toLowerCase() === e.toLowerCase();
              }
              return a === e;
          }));
        } else if (Array.isArray(expected)) {
          return expected.some(e => {
            if (typeof actual === 'string' && typeof e === 'string') {
              return actual.toLowerCase() === e.toLowerCase();
            }
            return actual === e;
          });
        }
      case 'NOT IN':
        if (Array.isArray(actual) && Array.isArray(expected)) {
          return !expected.some(e =>
            actual.some(a => {
              if (typeof a === 'string' && typeof e === 'string') {
                return a.toLowerCase() === e.toLowerCase();
              }
              return a === e;
          }));
        } else if (Array.isArray(expected)) {
          return !expected.some(e => {
            if (typeof actual === 'string' && typeof e === 'string') {
              return actual.toLowerCase() === e.toLowerCase();
            }
            return actual === e;
          });
        }
      case 'BETWEEN':
      case 'NOT BETWEEN':
        throw new QueryExpressionParseError(`Filter operation ${filter.op} is not yet implemented for Store.`);
      case 'IS NULL':
        return actual === undefined || actual === null;
      case 'IS NOT NULL':
        return actual !== undefined && actual !== null;
      default:
        throw new QueryExpressionParseError(`Filter operation ${filter.op} not recognized for Store.`);
    }
  }

  // Drupal only allows relationship queries which use the format '?filter[asset.id]=1a7bb66a-56a6-4f1f-a5d0-f3f61d35abce'
  // but internally Orbit.js needs to find the relationship by the first part - i.e. 'asset' - then compare the type and id
  // fields.
  let relationKey = filter.relation.split('.');

  if (filter.kind === 'relatedRecords') {
    let actual = deepGet(record, [
      'relationships',
      relationKey[0],
      'data'
    ]);
    if (actual === undefined) {
      return false;
    }
    let expected = filter.records;
    switch (filter.op) {
      case 'equal':
      case '=':
        return (
          actual.length === expected.length &&
          expected.every((e) =>
            actual.some((a) => a.id === e.id && a.type === e.type)
          )
        );
      case 'all':
        return expected.every((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      case 'some':
      case 'IN':
        return expected.some((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      case 'none':
      case 'NOT IN':
        return !expected.some((e) =>
          actual.some((a) => a.id === e.id && a.type === e.type)
        );
      default:
        throw new QueryExpressionParseError(
          'Filter operation ${filter.op} not recognized for Store.'
        );
    }
  } else if (filter.kind === 'relatedRecord') {
    let actual = deepGet(record, ['relationships', relationKey[0], 'data']);
    if (actual === undefined) {
      return false;
    }
    let expected = filter.record;
    switch (filter.op) {
      case 'equal':
      case '=':
        if (actual === null) {
          return expected === null;
        } else {
          if (Array.isArray(expected)) {
            return expected.some(
              (e) => actual.type === e.type && actual.id === e.id
            );
          } else if (expected) {
            return actual.type === expected.type && actual.id === expected.id;
          } else {
            return false;
          }
        }

      case 'IN':
        return Array.isArray(expected) && expected.some(
          (e) => actual.type === e.type && actual.id === e.id
        );

      case 'NOT IN':
        return Array.isArray(expected) && !expected.some(
          (e) => actual.type === e.type && actual.id === e.id
        );

      default:
        throw new QueryExpressionParseError(
          'Filter operation ${filter.op} not recognized for Store.'
        );
    }
  }
  return false;
}

function sortRecords(
    records,
    sortSpecifiers
  ) {
  const comparisonValues = new Map();

  records.forEach((record) => {
    comparisonValues.set(
      record,
      sortSpecifiers.map((sortSpecifier) => {
        if (sortSpecifier.kind === 'attribute') {
          let attributeKey = sortSpecifier.attribute.split('.');

          return deepGet(record, [
            'attributes',
            ...attributeKey,
          ]);
        } else {
          throw new QueryExpressionParseError(
            'Sort specifier ${sortSpecifier.kind} not recognized for Store.'
          );
        }
      })
    );
  });

  const comparisonOrders = sortSpecifiers.map((sortExpression) =>
    sortExpression.order === 'descending' ? -1 : 1
  );

  return records.sort((record1, record2) => {
    const values1 = comparisonValues.get(record1);
    const values2 = comparisonValues.get(record2);
    for (let i = 0; i < sortSpecifiers.length; i++) {
      if (values1[i] < values2[i]) {
        return -comparisonOrders[i];
      } else if (values1[i] > values2[i]) {
        return comparisonOrders[i];
      } else if (isNone(values1[i]) && !isNone(values2[i])) {
        return comparisonOrders[i];
      } else if (isNone(values2[i]) && !isNone(values1[i])) {
        return -comparisonOrders[i];
      }
    }
    return 0;
  });
}

function paginateRecords(
  records,
  paginationOptions
) {
  if (paginationOptions.limit !== undefined) {
    let offset =
      paginationOptions.offset === undefined ? 0 : paginationOptions.offset;
    let limit = paginationOptions.limit;

    return records.slice(offset, offset + limit);
  } else {
    throw new QueryExpressionParseError(
      'Pagination options not recognized for Store. Please specify `offset` and `limit`.'
    );
  }
}
