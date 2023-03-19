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
    this.schema = settings.schema;
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
          const filter = {
            group: {
              conjunction: filterSpecifier.op
            }
          };

          if (memberOf) {
            filter.group.memberOf = memberOf;
          }

          filters.push({
            [groupName]: filter,
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
          ['client-' + resourceAttribute.replaceAll('.', '-') + '-' + index]: filter,
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

  buildIncludeParam(includeSpecifier, request) {
    const schemaModels = this.schema.models;

    const getModels = types => types.filter(t => Object.hasOwn(schemaModels, t)).map(t => schemaModels[t]);

    const filters = request.options?.filter || [];

    let rootRecordModels = [];
    if (request.op === 'findRecords') {
      rootRecordModels.push(...getModels([request.type]));
    }
    if (request.op === 'findRelatedRecords') {
      const rootRecordModel = schemaModels[request.record.type];

      const refTypes = rootRecordModel.relationships[request.relationship].type || [];

      rootRecordModels.push(...getModels(refTypes));
    }

    // Traverse filters, finding nested relationship attribute filtering and adding
    // those relationship paths to the include specifier
    const walkFilter = (recordModels, relationPath, filter) => {
      if (filter.kind === 'group') {
        const subFilters = filter.filter;
        subFilters.forEach(f => walkFilter(recordModels, relationPath, f));
      }
      if (filter.kind === 'attribute') {
        let attributeKey = filter.attribute.split('.');

        if (!attributeKey[0]) {
          return
        }

        let isRelatedAttribute = false;

        const nestedRecordModels = recordModels.flatMap(recordModel => {
          if (!Object.hasOwn(recordModel.relationships, attributeKey[0])) {
            return [];
          }
          isRelatedAttribute = true;
          const refTypes = recordModel.relationships[attributeKey[0]].type || [];
          return getModels(refTypes);
        });

        if (!isRelatedAttribute) {
          return;
        }

        const nestedRelationPath = [...relationPath, attributeKey[0]];

        // Add the relation path to the include specifier
        const relationInclude = nestedRelationPath.join('.');
        if (!includeSpecifier.includes(relationInclude)) {
          includeSpecifier.push(relationInclude);
        }

        let relatedAttributeKey = attributeKey.slice(1);

        // If the next segment of the attribute key consists of only digits, then apply the filtering to only
        // that index of the relationship
        if (/^\d+$/.test(attributeKey[1])) {
          // Also skip the index when recursing into the related entities' attributes
          relatedAttributeKey = attributeKey.slice(2);
        }

        const subFilter = {
          kind: filter.kind,
          op: filter.op,
          attribute: relatedAttributeKey.join('.'),
          value: filter.value,
        };

        walkFilter(nestedRecordModels, nestedRelationPath, subFilter);
      }
    };
    filters.forEach(f => walkFilter(rootRecordModels, [], f));

    return super.buildIncludeParam(includeSpecifier, request);
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
