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

    filterSpecifiers.forEach((filterSpecifier, index) => {
      if (
        filterSpecifier.kind === 'attribute' &&
        filterSpecifier.op === 'equal'
      ) {
        const attributeFilter = filterSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `undefined`
        const resourceAttribute = this.serializeAttributeAsParam(
          undefined,
          attributeFilter.attribute
        );
        filters.push({ [resourceAttribute]: attributeFilter.value });
      } else if (filterSpecifier.kind === 'attribute') {
        const attributeFilter = filterSpecifier;
        const resourceAttribute = this.serializeAttributeAsParam(
          undefined,
          attributeFilter.attribute
        );
        filters.push({
          ['client-' + resourceAttribute + '-' + index]: {
            path: resourceAttribute,
            operator: attributeFilter.op,
            value: attributeFilter.value
          }
        });
      } else if (filterSpecifier.kind === 'relatedRecord') {
        const relatedRecordFilter = filterSpecifier;
        if (Array.isArray(relatedRecordFilter.record)) {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter.record
              .map((e) => e.id)
              .join(',')
          });
        } else {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter?.record?.id
          });
        }
      } else if (filterSpecifier.kind === 'relatedRecords') {
        if (filterSpecifier.op !== 'equal') {
          throw new Error(
            `Operation "${filterSpecifier.op}" is not supported in JSONAPI for relatedRecords filtering`
          );
        }
        const relatedRecordsFilter = filterSpecifier;
        filters.push({
          [relatedRecordsFilter.relation]: relatedRecordsFilter.records
            .map((e) => e.id)
            .join(',')
        });
      } else {
        throw new QueryExpressionParseError(
          `Filter operation ${filterSpecifier.op} not recognized for JSONAPISource.`
        );
      }
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
