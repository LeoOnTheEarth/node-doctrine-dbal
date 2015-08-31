module.exports = Comparator;

var Table = require('./Table.js');
var Column = require('./Column.js');
var Schema = require('./Schema.js');
var SchemaDiff = require('./SchemaDiff.js');
var ColumnDiff = require('./ColumnDiff.js');
var TableDiff = require('./TableDiff.js');
var ForeignKeyConstraint = require('./ForeignKeyConstraint.js');
var Sequence = require('./Sequence.js');
var php = require('phpjs');
var each = require('../util.js').forEach;
var validArg = require('../util.js').validArg;
var equal = require('array-equal');

/**
 * Class Comparator
 *
 * Compares two Schemas and return an instance of SchemaDiff.
 *
 * @constructor
 */
function Comparator() {}

var p = Comparator.prototype;

/**
 * @param {Schema} fromSchema
 * @param {Schema} toSchema
 *
 * @returns {SchemaDiff}
 */
Comparator.compareSchemas = function(fromSchema, toSchema) {
  validArg(fromSchema, 'fromSchema', Schema);
  validArg(toSchema, 'toSchema', Schema);

  var c = new Comparator();

  return c.compare(fromSchema, toSchema);
};

/**
 * Returns a SchemaDiff object containing the differences between the schemas $fromSchema and $toSchema.
 *
 * The returned differences are returned in such a way that they contain the
 * operations to change the schema stored in $fromSchema to the schema that is
 * stored in $toSchema.
 *
 * @param {Schema} fromSchema
 * @param {Schema} toSchema
 *
 * @return {SchemaDiff}
 */
p.compare = function(fromSchema, toSchema) {
  validArg(fromSchema, 'fromSchema', Schema);
  validArg(toSchema, 'toSchema', Schema);

  var diff = new SchemaDiff();
  var foreignKeysToTable = {};

  diff.fromSchema = fromSchema;

  each(toSchema.getNamespaces(), function(namespace) {
    if (!fromSchema.hasNamespace(namespace)) {
      diff.newNamespaces[namespace] = namespace;
    }
  });

  each(fromSchema.getNamespaces(), function(namespace) {
    if (!toSchema.hasNamespace(namespace)) {
      diff.removedNamespaces[namespace] = namespace;
    }
  });

  each(toSchema.getTables(), function(table) {
    var tableName = table.getShortestName(toSchema.getName());

    if (!fromSchema.hasTable(tableName)) {
      diff.newTables[tableName] = toSchema.getTable(tableName);
    } else {
      var tableDifferences = this.diffTable(fromSchema.getTable(tableName), toSchema.getTable(tableName));

      if (tableDifferences !== false) {
        diff.changedTables[tableName] = tableDifferences;
      }
    }
  }.bind(this));

  // Check if there are tables removed
  each(fromSchema.getTables(), function(table) {
    var tableName = table.getShortestName(fromSchema.getName());

    table = fromSchema.getTable(tableName);

    if (!toSchema.hasTable(tableName)) {
      diff.removedTables[tableName] = table;
    }

    // Also remember all foreign keys that point to a specific table
    each(table.getForeignKeys(), function(foreignKey) {
      var foreignTable = foreignKey.getForeignTableName().toLowerCase();

      if (!foreignKeysToTable.hasOwnProperty(foreignTable)) {
        foreignKeysToTable[foreignTable] = [];
      }

      foreignKeysToTable[foreignTable].push(foreignKey);
    });
  });

  each(diff.removedTables, function(table, tableName) {
    if (foreignKeysToTable.hasOwnProperty(tableName)) {
      diff.orphanedForeignKeys = php.array_merge(diff.orphanedForeignKeys, foreignKeysToTable[tableName]);

      // Deleting duplicated foreign keys present on both on the orphanedForeignKey
      // and the removedForeignKeys from changedTables
      each(foreignKeysToTable[tableName], function(foreignKey) {
        // LowerCase the table name to make if compatible with getShortestName
        var localTableName = foreignKey.getLocalTableName().toLowerCase();

        if (php.isset(diff.changedTables[localTableName])) {
          each(diff.changedTables[localTableName].removedForeignKeys, function(removedForeignKey, key) {
            delete diff.changedTables[localTableName].removedForeignKeys[key];
          });
        }
      });
    }
  });

  each(toSchema.getSequences(), function(sequence) {
    var sequenceName = sequence.getShortestName(toSchema.getName());

    if (!fromSchema.hasSequence(sequenceName)) {
      if (!this.isAutoIncrementSequenceInSchema(fromSchema, sequence)) {
        diff.newSequences.push(sequence);
      }
    } else {
      if (this.diffSequence(sequence, fromSchema.getSequence(sequenceName))) {
        diff.changedSequences.push(toSchema.getSequence(sequenceName));
      }
    }
  }.bind(this));

  each(fromSchema.getSequences(), function(sequence) {
    if (this.isAutoIncrementSequenceInSchema(toSchema, sequence)) {
      return true;
    }

    var sequenceName = sequence.getShortestName(fromSchema.getName());

    if (!toSchema.hasSequence(sequenceName)) {
      diff.removedSequences.push(sequence);
    }
  }.bind(this));

  return diff;
};

/**
 * @param {Schema}   schema
 * @param {Sequence} sequence
 *
 * @returns {boolean}
 *
 * @access private
 */
p.isAutoIncrementSequenceInSchema = function(schema, sequence) {
  var tables = schema.getTables();
  var tableNames = Object.keys(tables);
  var max = tableNames.length;

  for (var i = 0; i < max; ++i) {
    var table = tables[tableNames[i]];

    if (sequence.isAutoIncrementsFor(table)) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Sequence} sequence1
 * @param {Sequence} sequence2
 *
 * @returns {boolean}
 */
p.diffSequence = function(sequence1, sequence2) {
  validArg(sequence1, 'sequence1', Sequence);
  validArg(sequence2, 'sequence2', Sequence);

  if (sequence1.getAllocationSize() != sequence2.getAllocationSize()) {
    return true;
  }

  if (sequence1.getInitialValue() != sequence2.getInitialValue()) {
    return true;
  }

  return false;
};

/**
 * Returns the difference between the tables $table1 and $table2.
 *
 * If there are no differences this method returns the boolean false.
 *
 * @param {Table} table1
 * @param {Table} table2
 *
 * @returns {TableDiff|boolean}
 */
p.diffTable = function(table1, table2) {
  validArg(table1, 'table1', Table);
  validArg(table2, 'table2', Table);

  var changes = 0;
  var tableDifferences = new TableDiff(table1.getName());

  tableDifferences.fromTable = table1;

  var table1Columns = table1.getColumns();
  var table2Columns = table2.getColumns();

  // See if all the fields in table 1 exist in table 2
  each(table2Columns, function(column, columnName) {
    if (!table1.hasColumn(columnName)) {
      tableDifferences.addedColumns[columnName] = column;
      ++changes;
    }
  });

  // See if there are any removed fields in table 2
  each(table1Columns, function(column, columnName) {
    // See if column is removed in table 2.
    if (!table2.hasColumn(columnName)) {
      tableDifferences.removedColumns[columnName] = column;
      changes++;

      return true;
    }

    // See if column has changed properties in table 2.
    var changedProperties = this.diffColumn(column, table2.getColumn(columnName));

    if (!php.empty(changedProperties)) {
      var columnDiff = new ColumnDiff(column.getName(), table2.getColumn(columnName), changedProperties);

      columnDiff.fromColumn = column;
      tableDifferences.changedColumns[column.getName()] = columnDiff;
      changes++;
    }
  }.bind(this));

  this.detectColumnRenamings(tableDifferences);

  var table1Indexes = table1.getIndexes();
  var table2Indexes = table2.getIndexes();

  // See if all the indexes in table 1 exist in table 2
  each(table2Indexes, function(index, indexName) {
    if ((index.isPrimary() && table1.hasPrimaryKey()) || table1.hasIndex(indexName)) {
      return true;
    }

    tableDifferences.addedIndexes[indexName] = index;
    changes++;
  });

  // See if there are any removed indexes in table 2
  each(table1Indexes, function(index, indexName) {
    // See if index is removed in table 2.
    if ((index.isPrimary() && !table2.hasPrimaryKey()) ||
        !index.isPrimary() && !table2.hasIndex(indexName)
    ) {
      tableDifferences.removedIndexes[indexName] = index;
      changes++;

      return true;
    }

    // See if index has changed in table 2.
    var table2Index = index.isPrimary() ? table2.getPrimaryKey() : table2.getIndex(indexName);

    if (this.diffIndex(index, table2Index)) {
      tableDifferences.changedIndexes[indexName] = table2Index;
      changes++;
    }
  }.bind(this));

  this.detectIndexRenamings(tableDifferences);

  var fromFkeys = table1.getForeignKeys();
  var toFkeys = table2.getForeignKeys();

  each(fromFkeys, function(constraint1, key1) {
    each(toFkeys, function(constraint2, key2) {
      if (this.diffForeignKey(constraint1, constraint2) === false) {
        delete fromFkeys[key1];
        delete toFkeys[key2];
      } else if (constraint1.getName().toLowerCase() === constraint2.getName().toLowerCase()) {
        tableDifferences.changedForeignKeys.push(constraint2);
        changes++;

        delete fromFkeys[key1];
        delete toFkeys[key2];
      }
    }.bind(this));
  }.bind(this));

  each(fromFkeys, function(constraint1) {
    tableDifferences.removedForeignKeys.push(constraint1);
    changes++;
  });

  each(toFkeys, function(constraint2) {
    tableDifferences.addedForeignKeys.push(constraint2);
    changes++;
  });

  return changes ? tableDifferences : false;
};

/**
 * Try to find columns that only changed their name, rename operations maybe cheaper than add/drop
 * however ambiguities between different possibilities should not lead to renaming at all.
 *
 * @param {TableDiff} tableDifferences
 *
 * @returns {void}
 *
 * @access private
 */
p.detectColumnRenamings = function(tableDifferences) {
  validArg(tableDifferences, 'tableDifferences', TableDiff);

  var renameCandidates = {};

  Object.keys(tableDifferences.addedColumns).forEach(function(addedColumnName) {
    var addedColumn = tableDifferences.addedColumns[addedColumnName];
    var name = addedColumn.getName();

    if (!renameCandidates.hasOwnProperty(name)) {
      renameCandidates[name] = [];
    }

    Object.keys(tableDifferences.removedColumns).forEach(function(removedColumnName) {
      var removedColumn = tableDifferences.removedColumns[removedColumnName];

      if (this.diffColumn(addedColumn, removedColumn).length === 0) {
        renameCandidates[name].push([removedColumn, addedColumn, addedColumnName]);
      }
    }.bind(this));
  }.bind(this));

  Object.keys(renameCandidates).forEach(function(name) {
    var candidateColumns = renameCandidates[name];

    if (candidateColumns.length === 1) {
      var removedColumn = candidateColumns[0][0];
      var addedColumn = candidateColumns[0][1];
      var removedColumnName = removedColumn.getName().toLowerCase();
      var addedColumnName = addedColumn.getName().toLowerCase();

      if (!php.isset(tableDifferences.renamedColumns[removedColumnName])) {
        tableDifferences.renamedColumns[removedColumnName] = addedColumn;

        delete tableDifferences.addedColumns[addedColumnName];
        delete tableDifferences.removedColumns[removedColumnName];
      }
    }
  });
};

/**
 * Try to find indexes that only changed their name, rename operations maybe cheaper than add/drop
 * however ambiguities between different possibilities should not lead to renaming at all.
 *
 * @param {TableDiff} tableDifferences
 *
 * @returns {void}
 *
 * @access private
 */
p.detectIndexRenamings = function(tableDifferences) {
  validArg(tableDifferences, 'tableDifferences', TableDiff);

  var renameCandidates = {};

  // Gather possible rename candidates by comparing each added and removed index based on semantics.
  Object.keys(tableDifferences.addedIndexes).forEach(function(addedIndexName) {
    var addedIndex = tableDifferences.addedIndexes[addedIndexName];
    var name = addedIndex.getName();

    if (!renameCandidates.hasOwnProperty(name)) {
      renameCandidates[name] = [];
    }

    Object.keys(tableDifferences.removedIndexes).forEach(function(removedIndexName) {
      var removedIndex = tableDifferences.removedIndexes[removedIndexName];

      if (!this.diffIndex(addedIndex, removedIndex)) {
        renameCandidates[name].push([removedIndex, addedIndex, addedIndexName]);
      }
    }.bind(this));
  }.bind(this));

  Object.keys(renameCandidates).forEach(function(name) {
    var candidateIndexes = renameCandidates[name];

    // If the current rename candidate contains exactly one semantically equal index,
    // we can safely rename it.
    // Otherwise it is unclear if a rename action is really intended,
    // therefore we let those ambiguous indexes be added/dropped.
    if (candidateIndexes.length === 1) {
      var removedIndex = candidateIndexes[0][0];
      var addedIndex = candidateIndexes[0][1];
      var removedIndexName = removedIndex.getName().toLowerCase();
      var addedIndexName = addedIndex.getName().toLowerCase();

      if (!php.isset(tableDifferences.renamedIndexes[removedIndexName])) {
        tableDifferences.renamedIndexes[removedIndexName] = addedIndex;

        delete tableDifferences.removedIndexes[removedIndexName];
        delete tableDifferences.addedIndexes[addedIndexName];
      }
    }
  });
};

/**
 * @param {ForeignKeyConstraint} key1
 * @param {ForeignKeyConstraint} key2
 *
 * @returns {boolean}
 */
p.diffForeignKey = function(key1, key2) {
  validArg(key1, 'key1', ForeignKeyConstraint);
  validArg(key2, 'key2', ForeignKeyConstraint);

  if (!equal(
      key1.getUnquotedLocalColumns().map(function(val) { return val.toLowerCase(); }),
      key2.getUnquotedLocalColumns().map(function(val) { return val.toLowerCase(); })
    )) {
    return true;
  }

  if (!equal(
      key1.getUnquotedForeignColumns().map(function(val) { return val.toLowerCase(); }),
      key2.getUnquotedForeignColumns().map(function(val) { return val.toLowerCase(); })
    )) {
    return true;
  }

  if (key1.getUnqualifiedForeignTableName() !== key2.getUnqualifiedForeignTableName()) {
    return true;
  }

  if (key1.onUpdate() != key2.onUpdate()) {
    return true;
  }

  if (key1.onDelete() != key2.onDelete()) {
    return true;
  }

  return false;
};

/**
 * Returns the difference between the fields $field1 and $field2.
 *
 * If there are differences this method returns $field2, otherwise the
 * boolean false.
 *
 * @param {Column} column1
 * @param {Column} column2
 *
 * @returns {Array<string>}
 */
Comparator.prototype.diffColumn = function(column1, column2) {
  validArg(column1, 'column1', Column);
  validArg(column2, 'column2', Column);

  var properties1 = column1.toObject();
  var properties2 = column2.toObject();
  var changedProperties = [];

  ['notnull', 'unsigned', 'autoincrement'].forEach(function(property) {
    if (properties1[property] != properties2[property]) {
      changedProperties.push(property);
    }
  });

  if (properties1['type'].getName() !== properties2['type'].getName()) {
    changedProperties.push('type');
  }

  if (
    properties1['default'] != properties2['default'] ||
    // Null values need to be checked additionally as they tell whether to create or drop a default value.
    // null != 0, null != false, null != '' etc. This affects platform's table alteration SQL generation.
    (null === properties1['default'] && null !== properties2['default']) ||
    (null === properties2['default'] && null !== properties1['default'])
  ) {
    changedProperties.push('default');
  }

  if (properties1['type'].isDoctrineType('String') || properties1['type'].isDoctrineType('Binary')) {
    // check if value of length is set at all, default value assumed otherwise.
    var length1 = properties1['length'] ? properties1['length'] : 255;
    var length2 = properties2['length'] ? properties2['length'] : 255;

    if (length1 != length2) {
      changedProperties.push('length');
    }

    if (properties1['fixed'] != properties2['fixed']) {
      changedProperties.push('fixed');
    }
  } else if (properties1['type'].isDoctrineType('Decimal')) {
    var precision1 = properties1['precision'] ? properties1['precision'] : 10;
    var precision2 = properties2['precision'] ? properties2['precision'] : 10;

    if (precision1 != precision2) {
      changedProperties.push('precision');
    }

    if (properties1['scale'] != properties2['scale']) {
      changedProperties.push('scale');
    }
  }

  // A null value and an empty string are actually equal for a comment so they should not trigger a change.
  if (
    properties1['comment'] !== properties2['comment'] &&
    ! (null === properties1['comment'] && '' === properties2['comment']) &&
    ! (null === properties2['comment'] && '' === properties1['comment'])
  ) {
    changedProperties.push('comment');
  }

  var customOptions1 = column1.getCustomSchemaOptions();
  var customOptions2 = column2.getCustomSchemaOptions();

  php.array_merge(Object.keys(customOptions1), Object.keys(customOptions2)).forEach(function(key) {
    if (!properties1.hasOwnProperty(key) || !properties2.hasOwnProperty(key)) {
      changedProperties.push(key);
    } else if (properties1[key] !== properties2[key]) {
      changedProperties.push(key);
    }
  });

  var platformOptions1 = column1.getPlatformOptions();
  var platformOptions2 = column2.getPlatformOptions();

  Object.keys(php.array_intersect_key(platformOptions1, platformOptions2)).forEach(function(key) {
    if (properties1[key] !== properties2[key]) {
      changedProperties.push(key);
    }
  });

  return php.array_values(php.array_unique(changedProperties));
};

/**
 * Finds the difference between the indexes `index1` and `index2`.
 *
 * Compares $index1 with $index2 and returns $index2 if there are any
 * differences or false in case there are no differences.
 *
 * @param {Index} index1
 * @param {Index} index2
 *
 * @returns {boolean}
 */
p.diffIndex = function(index1, index2) {
  return !(index1.isFullfilledBy(index2) && index2.isFullfilledBy(index1));
};
