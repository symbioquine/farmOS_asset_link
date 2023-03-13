import { RecordQueryBuilder } from '@orbit/records';

class FilterGroupBuilder {
    constructor(parent, groupOp) {
      this._parent = parent;
      this.groupOp = groupOp;
      this._filter = [];
    }

    /**
     * Apply a filter expression.
     */
    filter(...params) {
        const specifiers = params.map((p) => this.$filterParamToSpecifier(p));
        this._filter = this._filter.concat(
          specifiers
        );
        return this;
    }

    /**
     * Apply a group of filters.
     */
    filterGroup(groupOp, filterGroupFn) {
      const filterGroupBuilder = new FilterGroupBuilder(this, groupOp);

      filterGroupFn(filterGroupBuilder);

      this._filter = this._filter.concat(
        [filterGroupBuilder.toGroupSpecifier()]
      );

      return this;
    }

    toGroupSpecifier() {
        return { kind: 'group', op: this.groupOp, filter: this._filter.slice() };
    }

    $filterParamToSpecifier(param) {
        return this._parent.$filterParamToSpecifier(param);
    }
}

class GroupableFindRecordsTerm {
  constructor(delegate) {
    this._delegate = delegate;
  }

  /**
   * Applies sorting to a collection query.
   */
  sort(...params) {
    this._delegate.sort(...params);
    return this;
  }

  /**
   * Applies pagination to a collection query.
   */
  page(param) {
    this._delegate.page(param);
    return this;
  }

  /**
   * Apply a filter expression.
   */
  filter(...params) {
    this._delegate.filter(...params);
    return this;
  }

  /**
   * Apply a group of filters.
   */
  filterGroup(groupOp, filterGroupFn) {
    const filterGroupBuilder = new FilterGroupBuilder(this, groupOp);

    filterGroupFn(filterGroupBuilder);

    this._delegate._expression.filter = this._delegate._expression.filter || [];
    this._delegate._expression.filter.push(
      filterGroupBuilder.toGroupSpecifier()
    );

    return this;
  }

  options(options) {
    this._delegate.options(options);
    return this;
  }

  toQueryExpression() {
    return this._delegate.toQueryExpression();
  }

  $filterParamToSpecifier(param) {
    return this._delegate.$filterParamToSpecifier(param);
  }

  get $queryBuilder() {
    return this._delegate.$queryBuilder;
  }
}

export default class DecoratedOrbitQueryBuilder {
  constructor(settings) {
    this._delegate = new RecordQueryBuilder({
      ...settings,
    });
  }

  /**
   * Find a record by its identity.
   */
  findRecord(record) {
    return this._delegate.findRecord(record);
  }

  /**
   * Find all records of a specific type.
   *
   * If `type` is unspecified, find all records unfiltered by type.
   */
  findRecords(typeOrIdentities) {
    return new GroupableFindRecordsTerm(this._delegate.findRecords(typeOrIdentities));
  }

  /**
   * Find a record in a to-one relationship.
   */
  findRelatedRecord(record, relationship) {
    return this._delegate.findRelatedRecord(record, relationship);
  }

  /**
   * Find records in a to-many relationship.
   */
  findRelatedRecords(record, relationship) {
    return new GroupableFindRecordsTerm(this._delegate.findRelatedRecords(record, relationship));
  }

  $normalizeRecordType(rt) {
    return this._delegate.$normalizeRecordType(rt);
  }

  $normalizeRecordIdentity(ri) {
    return this._delegate.$normalizeRecordIdentity(ri);
  }

}