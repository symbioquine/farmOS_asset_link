Some of the advanced query patterns in Asset Link / Orbit.js take some getting used to. The following examples are provided to help with that.

### Filtering by Nested Relationships

Filtering by nested relationship fields is accomplished using a dotted path - e.g. 'top_level_relationship.some_nested_relationship.some_attribute'. In the case of the following query, we can find animals whose parents have the animal type named "Sheep: Dorset":

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--animal`)
  .filter({ attribute: 'parent.animal_type.name',  op: '=', value: "Sheep: Dorset" }));
```

### Filtering on the Union/Intersection of Criteria

Asset Link extends Orbit.js to provide support for Drupal's JSON:API filter group operators - AND/OR. In the following query we can find equipment with "tractor" in either the name or the model.

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--equipment`)
  .filterGroup('OR', fg => fg
    .filter({ attribute: 'name', op: 'CONTAINS', value: 'tractor' })
    .filter({ attribute: 'model', op: 'CONTAINS', value: 'tractor' })
  ));
```

Similarly, we can also filter by the intersection of multiple criteria. In the following query we can find all the female Dorset sheep.

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--animal`)
  .filterGroup('AND', fg => fg
    .filter({ attribute: 'sex',  op: '=', value: 'F'})
    .filter({ attribute: 'animal_type.name', op: '=', value: 'Sheep: Dorset' })
  ));
```

### Multiple Criteria on the Same Nested Relationship Field

Filtering with multiple criteria on the same nested relationship field can involve a [known bug in Drupal](https://www.drupal.org/project/drupal/issues/3066202#comment-13181270).

For example, the following query will return zero results even if there exists an animal with two parents whose `drupal_internal__id` fields are `42` and `1337`.

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--animal`)
  .filterGroup('AND', fg => fg
    .filter({ attribute: 'parent.drupal_internal__id',  op: '=', value: '42'})
    .filter({ attribute: 'parent.drupal_internal__id', op: '=', value: '1337' })
  ));
```

In such cases, the work-around is to wrap the inner filter criteria in an extra layer of `OR` filter groups as shown below.

```js
await assetLink.entitySource.query(q => q
  .findRecords(`asset--animal`)
  .filterGroup('AND', fg => fg
    .filterGroup('OR', subFg => subFg
      .filter({ attribute: 'parent.drupal_internal__id',  op: '=', value: '42'}))
    .filterGroup('OR', subFg => subFg
      .filter({ attribute: 'parent.drupal_internal__id', op: '=', value: '1337' }))
  ));
```

### Writing Filters without the Builder

Some parts of the API in Asset Link accept additional filters as a list of objects instead of the builder syntax demonstrated above. The object representation of such filters is equivalent to the builder syntax. The following are some examples of translating between the two;

#### Attributes

```js
.filter({ attribute: 'parent.animal_type.name',  op: '=', value: "Sheep: Dorset" })
```

is equivalent to

```js
{ kind: 'attribute', attribute: 'parent.animal_type.name',  op: '=', value: "Sheep: Dorset" }
```

#### Filter Groups

```js
.filterGroup('OR', fg => fg
  .filter({ attribute: 'name', op: 'CONTAINS', value: 'tractor' })
  .filter({ attribute: 'model', op: 'CONTAINS', value: 'tractor' })
)
```

is equivalent to

```js
{
  kind: 'group',
  op: 'OR',
  filter: [
    { kind: 'attribute', attribute: 'name',  op: 'CONTAINS', value: 'tractor' },
    { kind: 'attribute', attribute: 'model',  op: 'CONTAINS', value: 'tractor' }
  ]
}
```