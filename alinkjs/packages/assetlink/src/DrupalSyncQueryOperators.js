import { SyncQueryOperators } from '@orbit/record-cache';
import { QueryExpressionParseError } from '@orbit/data';
import { RecordNotFoundException } from '@orbit/records';
import { deepGet, isNone } from '@orbit/utils';

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

function filterRecords(records, filters) {
  return records.filter((record) => {
    for (let i = 0, l = filters.length; i < l; i++) {
      if (!applyFilter(record, filters[i])) {
        return false;
      }
    }
    return true;
  });
}

function applyFilter(record, filter) {

  if (filter.kind === 'attribute') {
    let attributeKey = filter.attribute.split('.');

    let actual = deepGet(record, ['attributes', ...attributeKey]);

    let expected = filter.value;

    // https://api.drupal.org/api/drupal/core%21modules%21jsonapi%21src%21Query%21EntityCondition.php/property/EntityCondition%3A%3AallowedOperators/9.4.x
    switch (filter.op) {
      case 'equal':
      case '=':
        if (typeof actual === 'string') {
          return actual.toLowerCase() === expected.toLowerCase();
        }
        return actual === expected;
      case '<>':
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
        return typeof actual === 'string' && actual.toLowerCase().startsWith(expected.toLowerCase());
      case 'CONTAINS':
        return typeof actual === 'string' && actual.toLowerCase().includes(expected.toLowerCase());
      case 'ENDS_WITH':
        return typeof actual === 'string' && actual.toLowerCase().endsWith(expected.toLowerCase());
      case 'IN':
      case 'NOT IN':
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
  return SyncQueryOperators.applyFilter(record, filter);
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
