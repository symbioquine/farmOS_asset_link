import { JSONAPIURLBuilder } from "@orbit/jsonapi";
import { QueryExpressionParseError } from "@orbit/data";
import { JSONAPISerializers } from '@orbit/jsonapi';

/**
 * Extends {JSONAPIURLBuilder} to add support for Drupal JSON:API query operators.
 * 
 * Loosely based on https://gist.github.com/bradjones1/18ff9ebdb85455f781a2a212577653ce
 */
export default class DrupalJSONAPIURLBuilder extends JSONAPIURLBuilder {

  constructor(settings) {
    super(settings);
  }

  buildFilterParam(filterSpecifiers) {
    const filters = [];

    let nextFilterIndex = 0;

    const addFilterSpecifierToParams = (filterSpecifier, memberOf) => {
      const index = nextFilterIndex++;

      if (filterSpecifier.kind === 'group') {
        if (!['AND', 'OR'].includes(filterSpecifier.op)) {
          throw new QueryExpressionParseError(
            `Filter group operation ${filterSpecifier.op} not recognized for JSONAPISource.`
          );
        }

        const groupName = 'client-group-' + index;
        const subFilterSpecifiers = filterSpecifier.filter;

        if (subFilterSpecifiers?.length) {
          filters.push({
            [groupName]: {
              group: {
                conjunction: filterSpecifier.op
              }
            }
          });

          subFilterSpecifiers.forEach(subFilterSpecifier => {
            addFilterSpecifierToParams(subFilterSpecifier, groupName);
          });
        }

        return;
      }

      if (
        filterSpecifier.kind === 'attribute' &&
        filterSpecifier.op === 'equal' &&
        !memberOf
      ) {
        const attributeFilter = filterSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `undefined`
        const resourceAttribute = this.serializeAttributeAsParam(
          undefined,
          attributeFilter.attribute
        );

        // When comparing to booleans, Drupal requires a numeric '0' or '1'
        let filterValue = attributeFilter.value;
        if (attributeFilter.op === 'equal' && typeof filterValue === 'boolean') {
          filterValue = filterValue ? 1 : 0;
        }

        filters.push({ [resourceAttribute]: filterValue });
        return;
      }

      if (filterSpecifier.kind === 'attribute') {
        const attributeFilter = filterSpecifier;
        const resourceAttribute = this.serializeAttributeAsParam(
          undefined,
          attributeFilter.attribute
        );

        let filter = {
          path: resourceAttribute,
          operator: attributeFilter.op,
          value: attributeFilter.value
        };

        if (memberOf) {
          filter.memberOf = memberOf;
          filter = { condition: filter };
        }

        filters.push({
          ['client-' + resourceAttribute + '-' + index]: filter,
        });
        return;
      }

      const toRelationPath = r => !r.endsWith('.id') ? r + '.id' : r;

      if (
        ['relatedRecords', 'relatedRecord'].includes(filterSpecifier.kind) &&
        ['=', 'equal'].includes(filterSpecifier.op) &&
        !memberOf
      ) {
        const relatedRecordFilter = filterSpecifier;

        if (Array.isArray(relatedRecordFilter.record)) {
          // Disallow this for now because of https://www.drupal.org/project/drupal/issues/3066202
          throw new QueryExpressionParseError(
            `Filter ${filterSpecifier.kind} operation ${filterSpecifier.op} with multiple values is not supported for JSONAPISource.`
          );
        }

        const resourceRelationAttribute = this.serializeAttributeAsParam(
          undefined,
          filterSpecifier.relation
        );

        filters.push({
          [toRelationPath(resourceRelationAttribute)]: relatedRecordFilter?.record?.id
        });

        return;
      }

      if (
        ['relatedRecords', 'relatedRecord'].includes(filterSpecifier.kind) &&
        ['IN', 'NOT IN'].includes(filterSpecifier.op)
      ) {
        const relatedRecordFilter = filterSpecifier;

        let expected = relatedRecordFilter.record;
        if (!Array.isArray(expected)) {
          expected = [expected];
        }

        const resourceRelationAttribute = this.serializeAttributeAsParam(
          undefined,
          filterSpecifier.relation
        );

        let filter = {
          path: toRelationPath(resourceRelationAttribute),
          operator: filterSpecifier.op,
          value: {},
        };

        expected.forEach((e, idx) => {
          filter.value[idx] = e.id;
        });

        if (memberOf) {
          filter.memberOf = memberOf;
          filter = { condition: filter };
        }

        filters.push({
          ['client-' + resourceRelationAttribute + '-' + index]: filter,
        });

        return;
      }

      if (filterSpecifier.kind === 'relatedRecord') {
        const relatedRecordFilter = filterSpecifier;
        if (Array.isArray(relatedRecordFilter.record)) {
          // Disallow this for now because of https://www.drupal.org/project/drupal/issues/3066202
          throw new QueryExpressionParseError(
            `Filter ${filterSpecifier.kind} operation ${filterSpecifier.op} with multiple values is not supported for JSONAPISource.`
          );
        }

        const resourceRelationAttribute = this.serializeAttributeAsParam(
          undefined,
          filterSpecifier.relation
        );

        let filter = {
          path: toRelationPath(resourceRelationAttribute),
          operator: relatedRecordFilter.op,
          value: relatedRecordFilter.record.id
        };

        if (memberOf) {
          filter.memberOf = memberOf;
          filter = { condition: filter };
        }

        filters.push({
          ['client-' + resourceRelationAttribute + '-' + index]: filter,
        });
        return;
      }

      if (filterSpecifier.kind === 'relatedRecords') {

        if (filterSpecifier.op === 'some') {
          const resourceRelationAttribute = this.serializeAttributeAsParam(
              undefined,
              filterSpecifier.relation
            );

          const filter = {
            path: toRelationPath(resourceRelationAttribute),
            operator: 'IN',
            value: {},
          };

          filterSpecifier.records.forEach((e, idx) => {
            filter.value[idx] = e.id;
          });

          if (memberOf) {
            filter.memberOf = memberOf;
            filter = { condition: filter };
          }

          filters.push({
            ['client-' + resourceRelationAttribute + '-' + index]: filter,
          });
          return;
        }

      }

      console.log(filterSpecifier);

      throw new QueryExpressionParseError(
        `Filter ${filterSpecifier.kind} operation ${filterSpecifier.op} not recognized for JSONAPISource.`
      );
    };

    filterSpecifiers.forEach((filterSpecifier) => {
      addFilterSpecifierToParams(filterSpecifier);
    });

    return filters;
  }

  serializeAttributeAsParam(type, attribute) {
      if (this.serializer) {
        return this.serializer.resourceAttribute(type, attribute);
      } else {
        const serializer = this.serializerFor(JSONAPISerializers.ResourceFieldParam);
        return serializer.serialize(attribute, { type });
      }
    }

}
