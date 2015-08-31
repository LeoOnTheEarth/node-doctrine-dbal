var TableDiff = require('../../lib/Schema/TableDiff.js');
var Table = require('../../lib/Schema/Table.js');
var ColumnDiff = require('../../lib/Schema/ColumnDiff.js');
var Column = require('../../lib/Schema/Column.js');
var Comparator = require('../../lib/Schema/Comparator.js');
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var Index = require('../../lib/Schema/Index.js');
var Schema = require('../../lib/Schema/Schema.js');
var SchemaConfig = require('../../lib/Schema/SchemaConfig.js');
var SchemaDiff = require('../../lib/Schema/SchemaDiff.js');
var Sequence = require('../../lib/Schema/Sequence.js');
var Type = require('../Mocks/Types/MockType.js');
var UnitTest = require('../UnitTest.js');
var assert = require('chai').assert;
var php = require('phpjs');
var clone = require('clone');
var gently = new(require('gently'));
var inherits = require('util').inherits;

/**
 * Class ComparatorTest
 *
 * @constructor
 */
function ComparatorTest() {}

inherits(ComparatorTest, UnitTest);

var p = ComparatorTest.prototype;

p.getName = function() {
  return 'Schema/Comparator';
};

p.testCompareSame1 = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer'))
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer'))
      }
    )
  });

  var expected = new SchemaDiff();

  expected.fromSchema = schema1;

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareSame2 = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield2": new Column('integerfield2', Type.getType('integer')),
        "integerfield1": new Column('integerfield1', Type.getType('integer'))
      }
    )
  });

  var expected = new SchemaDiff();

  expected.fromSchema = schema1;

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareMissingTable = function() {
  var schemaConfig = new SchemaConfig();
  var table = new Table('bugdb', {"integerfield1": new Column('integerfield1', Type.getType('integer'))});

  table.setSchemaConfig(schemaConfig);

  var schema1 = new Schema({"table": table}, [], schemaConfig);
  var schema2 = new Schema({},               [], schemaConfig);
  var expected = new SchemaDiff({}, {}, {"bugdb": table}, schema1);

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareNewTable = function() {
  var schemaConfig = new SchemaConfig();
  var table = new Table('bugdb', {"integerfield1": new Column('integerfield1', Type.getType('integer'))});

  table.setSchemaConfig(schemaConfig);

  var schema1 = new Schema({},               [], schemaConfig);
  var schema2 = new Schema({"table": table}, [], schemaConfig);
  var expected = new SchemaDiff({"bugdb": table}, {}, {}, schema1);

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareOnlyAutoincrementChanged = function() {
  var column1 = new Column('foo', Type.getType('integer'), {"autoincrement": true});
  var column2 = new Column('foo', Type.getType('integer'), {"autoincrement": false});

  var comparator = new Comparator();
  var changedProperties = comparator.diffColumn(column1, column2);

  it('should be the expected changed properties', function() {
    assert.deepEqual(changedProperties, ['autoincrement']);
  });
};

p.testCompareMissingField = function() {
  var missingColumn = new Column('integerfield1', Type.getType('integer'));
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": missingColumn,
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });

  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff('bugdb', {}, {}, {"integerfield1": missingColumn})
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareNewField = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer'))
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });

  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff(
        'bugdb',
        {
          "integerfield2": new Column('integerfield2', Type.getType('integer'))
        }
      )
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareChangedColumns_ChangeType = function() {
  var column1 = new Column('charfield1', Type.getType('string'));
  var column2 = new Column('charfield1', Type.getType('integer'));
  var c = new Comparator();

  it('should be the same column property list', function() {
    assert.deepEqual(c.diffColumn(column1, column2), ['type']);
    assert.deepEqual(c.diffColumn(column1, column1), []);
  });
};

p.testCompareChangedColumns_ChangeCustomSchemaOption = function() {
  var column1 = new Column('charfield1', Type.getType('string'));
  var column2 = new Column('charfield1', Type.getType('string'));

  column1.setCustomSchemaOption('foo', 'bar');
  column2.setCustomSchemaOption('foo', 'bar');

  column1.setCustomSchemaOption('foo1', 'bar1');
  column2.setCustomSchemaOption('foo2', 'bar2');

  var c = new Comparator();

  it('should be the same column property list', function() {
    assert.deepEqual(c.diffColumn(column1, column2), ['foo1', 'foo2']);
    assert.deepEqual(c.diffColumn(column1, column1), []);
  });
};

p.testCompareChangeColumns_MultipleNewColumnsRename = function() {
  var tableA = new Table("foo");

  tableA.addColumn('datefield1', Type.getType('datetime'));

  var tableB = new Table("foo");

  tableB.addColumn('new_datefield1', Type.getType('datetime'));
  tableB.addColumn('new_datefield2', Type.getType('datetime'));

  var c = new Comparator();
  var tableDiff = c.diffTable(tableA, tableB);

  it('should be expected TableDiff property', function() {
    assert.equal(php.count(tableDiff.renamedColumns), 1, 'we should have one rename datefield1 => new_datefield1.');
    assert.property(tableDiff.renamedColumns, 'datefield1', "'datefield1' should be set to be renamed to new_datefield1");
    assert.equal(php.count(tableDiff.addedColumns), 1, "'new_datefield2' should be added");
    assert.property(tableDiff.addedColumns, 'new_datefield2', "'new_datefield2' should be added, not created through renaming!");
    assert.equal(php.count(tableDiff.removedColumns), 0, 'Nothing should be removed.');
    assert.equal(php.count(tableDiff.changedColumns), 0, 'Nothing should be changed as all fields old & new have diff names.');
  });
};

p.testCompareRemovedIndex = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield1'], true)
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });

  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff(
        'bugdb', {}, {}, {}, {}, {}, {"primary": new Index('primary', ['integerfield1'], true)}
      )
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareNewIndex = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield1'], true)
      }
    )
  });
  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff(
        'bugdb', {}, {}, {}, {"primary": new Index('primary', ['integerfield1'], true)}
      )
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareChangedIndex = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield1'], true)
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield1', 'integerfield2'], true)
      }
    )
  });
  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff(
        'bugdb', {}, {}, {}, {}, {"primary": new Index('primary', ['integerfield1', 'integerfield2'], true)}
      )
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareChangedIndexFieldPositions = function() {
  var schema1 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield1', 'integerfield2'], true)
      }
    )
  });
  var schema2 = new Schema({
    "bugdb": new Table(
      'bugdb',
      {
        "integerfield1": new Column('integerfield1', Type.getType('integer')),
        "integerfield2": new Column('integerfield2', Type.getType('integer'))
      },
      {
        "primary": new Index('primary', ['integerfield2', 'integerfield1'], true)
      }
    )
  });
  var expected = new SchemaDiff(
    {},
    {
      "bugdb": new TableDiff(
        'bugdb', {}, {}, {}, {}, {"primary": new Index('primary', ['integerfield2', 'integerfield1'], true)}
      )
    }
  );

  expected.fromSchema = schema1;
  expected.changedTables['bugdb'].fromTable = schema1.getTable('bugdb');

  it('should be the same SchemaDiff instance', function() {
    assert.deepEqual(Comparator.compareSchemas(schema1, schema2), expected);
  });
};

p.testCompareSequences = function() {
  var seq1 = new Sequence('foo', 1, 1);
  var seq2 = new Sequence('foo', 1, 2);
  var seq3 = new Sequence('foo', 2, 1);
  var c = new Comparator();

  it('should be the same Sequence instances', function() {
    assert.isTrue(c.diffSequence(seq1, seq2));
    assert.isTrue(c.diffSequence(seq1, seq3));
  });
};

p.testRemovedSequence = function() {
  var schema1 = new Schema();
  var seq = schema1.createSequence('foo');
  var schema2 = new Schema();
  var c = new Comparator();
  var diffSchema = c.compare(schema1, schema2);

  it('should be the expected SchemaDiff instances', function() {
    assert.equal(php.count(diffSchema.removedSequences), 1);
    assert.deepEqual(diffSchema.removedSequences[0], seq);
  });
};

p.testAddedSequence = function() {
  var schema1 = new Schema();
  var schema2 = new Schema();
  var seq = schema2.createSequence('foo');
  var c = new Comparator();
  var diffSchema = c.compare(schema1, schema2);

  it('should be the expected SchemaDiff instances', function() {
    assert.equal(php.count(diffSchema.newSequences), 1);
    assert.deepEqual(diffSchema.newSequences[0], seq);
  });
};

p.testTableAddForeignKey = function() {
  var tableForeign = new Table('bar');

  tableForeign.addColumn('id', Type.getType('integer'));

  var table1 = new Table('foo');

  table1.addColumn('fk', Type.getType('integer'));

  var table2 = new Table('foo');

  table2.addColumn('fk', Type.getType('integer'));
  table2.addForeignKeyConstraint(tableForeign, ['fk'], ['id']);

  var c = new Comparator();
  var tableDiff = c.diffTable(table1, table2);

  it('should be the expected TableDiff instances', function() {
    assert.instanceOf(tableDiff, TableDiff);
    assert.equal(php.count(tableDiff.addedForeignKeys), 1);
  });
};

p.testTableRemoveForeignKey = function() {
  var tableForeign = new Table('bar');

  tableForeign.addColumn('id', Type.getType('integer'));

  var table1 = new Table('foo');

  table1.addColumn('fk', Type.getType('integer'));

  var table2 = new Table('foo');

  table2.addColumn('fk', Type.getType('integer'));
  table2.addForeignKeyConstraint(tableForeign, ['fk'], ['id']);

  var c = new Comparator();
  var tableDiff = c.diffTable(table2, table1);

  it('should be the expected TableDiff instances', function() {
    assert.instanceOf(tableDiff, TableDiff);
    assert.equal(php.count(tableDiff.removedForeignKeys), 1);
  });
};

p.testTableUpdateForeignKey = function() {
  var tableForeign = new Table('bar');

  tableForeign.addColumn('id', Type.getType('integer'));

  var table1 = new Table('foo');

  table1.addColumn('fk', Type.getType('integer'));
  table1.addForeignKeyConstraint(tableForeign, ['fk'], ['id']);

  var table2 = new Table('foo');

  table2.addColumn('fk', Type.getType('integer'));
  table2.addForeignKeyConstraint(tableForeign, ['fk'], ['id'], {"onUpdate": "CASCADE"});

  var c = new Comparator();
  var tableDiff = c.diffTable(table1, table2);

  it('should be the expected TableDiff instances', function() {
    assert.instanceOf(tableDiff, TableDiff);
    assert.equal(php.count(tableDiff.changedForeignKeys), 1);
  });
};

p.testMovedForeignKeyForeignTable = function() {
  var tableForeign = new Table('bar');
  var tableForeign2 = new Table('bar2');

  tableForeign.addColumn('id', Type.getType('integer'));
  tableForeign2.addColumn('id', Type.getType('integer'));

  var table1 = new Table("foo");
  var table2 = new Table("foo");

  table1.addColumn('fk', Type.getType('integer'));
  table1.addForeignKeyConstraint(tableForeign, ['fk'], ['id']);
  table2.addColumn('fk', Type.getType('integer'));
  table2.addForeignKeyConstraint(tableForeign2, ['fk'], ['id']);

  var c = new Comparator();
  var tableDiff = c.diffTable(table1, table2);

  it('should be the expected TableDiff instances', function() {
    assert.instanceOf(tableDiff, TableDiff);
    assert.equal(php.count(tableDiff.changedForeignKeys), 1);
  });
};

p.testTablesCaseInsensitive = function() {
  var schemaA = new Schema();
  var schemaB = new Schema();

  schemaA.createTable('foo');
  schemaA.createTable('bAr');
  schemaA.createTable('BAZ');
  schemaA.createTable('new');

  schemaB.createTable('FOO');
  schemaB.createTable('bar');
  schemaB.createTable('Baz');
  schemaB.createTable('old');

  var c = new Comparator();
  var diff = c.compare(schemaA, schemaB);

  it('should be the expected SchemaDiff instances', function() {
    assert.equal(php.count(diff.newTables), 1);
    assert.equal(php.count(diff.changedTables), 0);
    assert.equal(php.count(diff.removedTables), 1);
  });
};

p.testSequencesCaseInsensitive = function() {
  var schemaA = new Schema();
  var schemaB = new Schema();

  schemaA.createSequence('foo');
  schemaA.createSequence('BAR');
  schemaA.createSequence('Baz');
  schemaA.createSequence('new');

  schemaB.createSequence('FOO');
  schemaB.createSequence('Bar');
  schemaB.createSequence('baz');
  schemaB.createSequence('old');

  var c = new Comparator();
  var diff = c.compare(schemaA, schemaB);

  it('should be the expected SchemaDiff instances', function() {
    assert.equal(php.count(diff.newSequences), 1, 'Expected number of new sequences is wrong.');
    assert.equal(php.count(diff.changedSequences), 0, 'Expected number of changed sequences is wrong.');
    assert.equal(php.count(diff.removedSequences), 1, 'Expected number of removed sequences is wrong.');
  });
};

p.testCompareColumnCompareCaseInsensitive = function() {
  var tableA = new Table('foo');
  var tableB = new Table('foo');

  tableA.addColumn('id', Type.getType('integer'));
  tableB.addColumn('ID', Type.getType('integer'));

  var c = new Comparator();
  var tableDiff = c.diffTable(tableA, tableB);

  it('should be false when the two tables are the same', function() {
    assert.isFalse(tableDiff);
  });
};

p.testCompareIndexBasedOnPropertiesNotName = function() {
  var tableA = new Table("foo");
  var tableB = new Table("foo");

  tableA.addColumn('id', Type.getType('integer'));
  tableA.addIndex(['id'], 'foo_bar_idx');
  tableB.addColumn('ID', Type.getType('integer'));
  tableB.addIndex(['id'], 'bar_foo_idx');

  var c = new Comparator();
  var tableDiff = new TableDiff('foo');

  tableDiff.fromTable = tableA;
  tableDiff.renamedIndexes['foo_bar_idx'] = new Index('bar_foo_idx', ['id']);

  it('should be the same TableDiff instances', function() {
    assert.deepEqual(c.diffTable(tableA, tableB), tableDiff);
  });
};

p.testCompareForeignKeyBasedOnPropertiesNotName = function() {
  var tableA = new Table("foo");
  var tableB = new Table("foo");

  tableA.addColumn('id', Type.getType('integer'));
  tableA.addNamedForeignKeyConstraint('foo_constraint', 'bar', ['id'], ['id']);

  tableB.addColumn('ID', Type.getType('integer'));
  tableB.addNamedForeignKeyConstraint('bar_constraint', 'bar', ['id'], ['id']);

  var c = new Comparator();
  var tableDiff = c.diffTable(tableA, tableB);

  it('should be false when the two tables are the same', function() {
    assert.isFalse(tableDiff);
  });
};

p.testCompareForeignKey_RestrictNoAction_AreTheSame = function() {
  var fk1 = new ForeignKeyConstraint(['foo'], 'bar', ['baz'], 'fk1', {"onDelete": 'NO ACTION'});
  var fk2 = new ForeignKeyConstraint(['foo'], 'bar', ['baz'], 'fk1', {"onDelete": 'RESTRICT'});

  var c = new Comparator();

  it('should be false when the two foreign keys are the same', function() {
    assert.isFalse(c.diffForeignKey(fk1, fk2));
  });
};

p.testCompareForeignKeyNamesUnqualified_AsNoSchemaInformationIsAvailable = function() {
  var fk1 = new ForeignKeyConstraint(['foo'], 'foo.bar', ['baz'], 'fk1');
  var fk2 = new ForeignKeyConstraint(['foo'], 'baz.bar', ['baz'], 'fk1');

  var c = new Comparator();

  it('should be false when the two foreign keys are the same', function() {
    assert.isFalse(c.diffForeignKey(fk1, fk2));
  });
};

p.testDetectRenameColumn = function() {
  var tableA = new Table('foo');
  var tableB = new Table('foo');

  tableA.addColumn('foo', Type.getType('integer'));
  tableB.addColumn('bar', Type.getType('integer'));

  var c = new Comparator();
  var tableDiff = c.diffTable(tableA, tableB);

  it('should be the expected TableDiff instance', function() {
    assert.equal(0, php.count(tableDiff.addedColumns));
    assert.equal(0, php.count(tableDiff.removedColumns));
    assert.property(tableDiff.renamedColumns, 'foo');
    assert.equal('bar', tableDiff.renamedColumns['foo'].getName());
  });
};

/**
 * You can easily have ambiguities in the column renaming. If these
 * are detected no renaming should take place, instead adding and dropping
 * should be used exclusively.
 */
p.testDetectRenameColumnAmbiguous = function() {
  var tableA = new Table("foo");
  var tableB = new Table("foo");

  tableA.addColumn('foo', Type.getType('integer'));
  tableA.addColumn('bar', Type.getType('integer'));
  tableB.addColumn('baz', Type.getType('integer'));

  var c = new Comparator();
  var tableDiff = c.diffTable(tableA, tableB);

  it('should be the expected TableDiff instance', function() {
    assert.equal(php.count(tableDiff.addedColumns), 1, "'baz' should be added, not created through renaming!");
    assert.property(tableDiff.addedColumns, 'baz', "'baz' should be added, not created through renaming!");
    assert.equal(php.count(tableDiff.removedColumns), 2, "'foo' and 'bar' should both be dropped, an ambiguity exists which one could be renamed to 'baz'.");
    assert.property(tableDiff.removedColumns, 'foo', "'foo' should be removed.");
    assert.property(tableDiff.removedColumns, 'bar', "'bar' should be removed.");
    assert.equal(php.count(tableDiff.renamedColumns), 0, "no renamings should take place.");
  });
};

p.testDetectRenameIndex = function() {
  var table1 = new Table('foo');

  table1.addColumn('foo', Type.getType('integer'));

  /** @type {Table} table2 */
  var table2 = clone(table1);

  table1.addIndex(['foo'], 'idx_foo');
  table2.addIndex(['foo'], 'idx_bar');

  var comparator = new Comparator();
  var tableDiff = comparator.diffTable(table1, table2);

  it('should be the expected TableDiff instance', function() {
    assert.equal(php.count(tableDiff.addedIndexes), 0);
    assert.equal(php.count(tableDiff.removedIndexes), 0);
    assert.property(tableDiff.renamedIndexes, 'idx_foo');
    assert.equal(tableDiff.renamedIndexes['idx_foo'].getName(), 'idx_bar');
  });
};

/**
 * You can easily have ambiguities in the index renaming. If these
 * are detected no renaming should take place, instead adding and dropping
 * should be used exclusively.
 */
p.testDetectRenameIndexAmbiguous = function() {
  var table1 = new Table('foo');

  table1.addColumn('foo', Type.getType('integer'));

  /** @type {Table} */
  var table2 = clone(table1);

  table1.addIndex(['foo'], 'idx_foo');
  table1.addIndex(['foo'], 'idx_bar');
  table2.addIndex(['foo'], 'idx_baz');

  var comparator = new Comparator();
  var tableDiff = comparator.diffTable(table1, table2);

  it('should be the expected TableDiff instance', function() {
    assert.equal(php.count(tableDiff.addedIndexes), 1);
    assert.property(tableDiff.addedIndexes, 'idx_baz');
    assert.equal(php.count(tableDiff.removedIndexes), 2);
    assert.property(tableDiff.removedIndexes, 'idx_foo');
    assert.property(tableDiff.removedIndexes, 'idx_bar');
    assert.equal(php.count(tableDiff.renamedIndexes), 0);
  });
};

p.testDiff = function() {
  var table = new Table('twitter_users');

  table.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  table.addColumn('twitterId', Type.getType('integer'), {"nullable": false});
  table.addColumn('displayName', Type.getType('string'), {"nullable": false});
  table.setPrimaryKey(['id']);

  var newTable = new Table('twitter_users');

  newTable.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  newTable.addColumn('twitter_id', Type.getType('integer'), {"nullable": false});
  newTable.addColumn('display_name', Type.getType('string'), {"nullable": false});
  newTable.addColumn('logged_in_at', Type.getType('datetime'), {"nullable": true});
  newTable.setPrimaryKey(['id']);

  var c = new Comparator();
  var tableDiff = c.diffTable(table, newTable);

  it('should be the expected TableDiff instance', function() {
    assert.instanceOf(tableDiff, TableDiff);
    assert.deepEqual(php.array_keys(tableDiff.renamedColumns), ['twitterid', 'displayname']);
    assert.deepEqual(php.array_keys(tableDiff.addedColumns), ['logged_in_at']);
    assert.equal(php.count(tableDiff.removedColumns), 0);
  });
};

p.testChangedSequence = function() {
  var schema = new Schema();

  schema.createSequence('baz');

  /* @type {Schema} */
  var schemaNew = clone(schema);
  
  schemaNew.getSequence('baz').setAllocationSize(20);

  var c = new Comparator();
  var diff = c.compare(schema, schemaNew);

  it('should be the expected Sequence instance', function() {
    assert.deepEqual(schemaNew.getSequence('baz'), diff.changedSequences[0]);
  });
};

p.testDiffDecimalWithNullPrecision = function() {
  var column = new Column('foo', Type.getType('decimal'));
  var column2 = new Column('foo', Type.getType('decimal'));
  var c = new Comparator();

  column.setPrecision(null);

  it('should be the expected diff column names', function() {
    assert.deepEqual(c.diffColumn(column, column2), []);
  })
};

p.testFqnSchemaComparison = function() {
  var config = new SchemaConfig();

  config.setName('foo');

  var oldSchema = new Schema({}, [], config);

  oldSchema.createTable('bar');

  var newSchema= new Schema({}, [], config);

  newSchema.createTable('foo.bar');

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;

  it('should be the expected SchemaDiff instances', function() {
    assert.deepEqual(Comparator.compareSchemas(oldSchema, newSchema), expected);
  });
};

p.testNamespacesComparison = function() {
  var config = new SchemaConfig();

  config.setName('schemaName');

  var oldSchema = new Schema({}, [], config);

  oldSchema.createTable('taz');
  oldSchema.createTable('war.tab');

  var newSchema= new Schema({}, [], config);

  newSchema.createTable('bar.tab');
  newSchema.createTable('baz.tab');
  newSchema.createTable('war.tab');

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;
  expected.newNamespaces = {"bar": 'bar', "baz": 'baz'};

  var diff = Comparator.compareSchemas(oldSchema, newSchema);

  it('should be the expected SchemaDiff instances', function() {
    assert.deepEqual(diff.newNamespaces, {"bar": 'bar', "baz": 'baz'});
    assert.equal(php.count(diff.newTables), 2);
  });
};

p.testFqnSchemaComparisonDifferentSchemaNameButSameTableNoDiff = function() {
  var config = new SchemaConfig();

  config.setName('foo');

  var oldSchema = new Schema({}, [], config);

  oldSchema.createTable('foo.bar');

  var newSchema = new Schema();

  newSchema.createTable('bar');

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;

  it('should be the expected SchemaDiff instances', function() {
    assert.deepEqual(Comparator.compareSchemas(oldSchema, newSchema), expected);
  });
};

p.testFqnSchemaComparisonNoSchemaSame = function() {
  var config = new SchemaConfig();

  config.setName("foo");

  var oldSchema = new Schema({}, [], config);

  oldSchema.createTable('bar');

  var newSchema = new Schema();

  newSchema.createTable('bar');

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;

  it('should be the expected SchemaDiff instances', function() {
    assert.deepEqual(Comparator.compareSchemas(oldSchema, newSchema), expected);
  });
};

p.testAutoIncrementSequences = function() {
  var oldSchema = new Schema();
  var table = oldSchema.createTable('foo');

  table.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  table.setPrimaryKey(['id']);
  oldSchema.createSequence('foo_id_seq');

  var newSchema = new Schema();

  table = newSchema.createTable('foo');
  table.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  table.setPrimaryKey(['id']);

  var c = new Comparator();
  var diff = c.compare(oldSchema, newSchema);

  it('should be no removed sequences', function() {
    assert.equal(php.count(diff.removedSequences), 0);
  });
};


/**
 * Check that added autoincrement sequence is not populated in newSequences
 */
p.testAutoIncrementNoSequences = function() {
  var oldSchema = new Schema();
  var table = oldSchema.createTable('foo');

  table.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  table.setPrimaryKey(['id']);

  var newSchema = new Schema();

  table = newSchema.createTable('foo');
  table.addColumn('id', Type.getType('integer'), {"autoincrement": true});
  table.setPrimaryKey(['id']);
  newSchema.createSequence('foo_id_seq');

  var c = new Comparator();
  var diff = c.compare(oldSchema, newSchema);

  it('should be no removed sequences', function() {
    assert.equal(php.count(diff.newSequences), 0);
  });
};

/**
 * You can get multiple drops for a FK when a table referenced by a foreign
 * key is deleted, as this FK is referenced twice, once on the orphanedForeignKeys
 * array because of the dropped table, and once on changedTables array. We
 * now check that the key is present once.
 */
p.testAvoidMultipleDropForeignKey = function() {
  var oldSchema = new Schema();
  var tableForeign = oldSchema.createTable('foreign');

  tableForeign.addColumn('id', Type.getType('integer'));

  var table = oldSchema.createTable('foo');

  table.addColumn('fk', Type.getType('integer'));
  table.addForeignKeyConstraint(tableForeign, ['fk'], ['id']);

  var newSchema = new Schema();

  newSchema.createTable('foo');

  var c = new Comparator();
  var diff = c.compare(oldSchema, newSchema);

  it('should be no removed foreign key', function() {
    assert.equal(php.count(diff.changedTables['foo'].removedForeignKeys), 0);
  });

  it('should be one orphaned foreign key', function() {
    assert.equal(php.count(diff.orphanedForeignKeys), 1);
  });
};

p.testCompareChangedColumn = function() {
  var oldSchema = new Schema();
  var tableFoo = oldSchema.createTable('foo');

  tableFoo.addColumn('id', Type.getType('integer'));

  var newSchema = new Schema();
  var table = newSchema.createTable('foo');

  table.addColumn('id', Type.getType('string'));

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;

  var tableDiff = expected.changedTables['foo'] = new TableDiff('foo');

  tableDiff.fromTable = tableFoo;

  var columnDiff = tableDiff.changedColumns['id'] = new ColumnDiff('id', table.getColumn('id'));

  columnDiff.fromColumn = tableFoo.getColumn('id');
  columnDiff.changedProperties = ['type'];

  it('should be the same SchemaDiff instances', function() {
    assert.deepEqual(Comparator.compareSchemas(oldSchema, newSchema), expected);
  });
};

p.testCompareChangedBinaryColumn = function() {
  var oldSchema = new Schema();
  var tableFoo = oldSchema.createTable('foo');

  tableFoo.addColumn('id', Type.getType('binary'));

  var newSchema = new Schema();
  var table = newSchema.createTable('foo');

  table.addColumn('id', Type.getType('binary'), {"length": 42, "fixed": true});

  var expected = new SchemaDiff();

  expected.fromSchema = oldSchema;
  expected.changedTables['foo'] = new TableDiff('foo');

  var tableDiff = expected.changedTables['foo'];

  tableDiff.fromTable = tableFoo;
  tableDiff.changedColumns['id'] = new ColumnDiff('id', table.getColumn('id'));

  var columnDiff = tableDiff.changedColumns['id'];

  columnDiff.fromColumn = tableFoo.getColumn('id');
  columnDiff.changedProperties = ['length', 'fixed'];

  it('should be the same SchemaDiff instances', function() {
    assert.deepEqual(Comparator.compareSchemas(oldSchema, newSchema), expected);
  });
};

p.testCompareQuotedAndUnquotedForeignKeyColumns = function() {
  var fk1 = new ForeignKeyConstraint(['foo'], 'bar', ['baz'], 'fk1', {"onDelete": 'NO ACTION'});
  var fk2 = new ForeignKeyConstraint(['`foo`'], 'bar', ['`baz`'], 'fk1', {"onDelete": 'NO ACTION'});
  var comparator = new Comparator();
  var diff = comparator.diffForeignKey(fk1, fk2);

  it('should be no difference between fk1 and fk2', function() {
    assert.isFalse(diff);
  });
};

p.testDiffColumnPlatformOptions = function() {
  var column1 = new Column('foo', Type.getType('string'), {"platformOptions": {"foo": 'foo', "bar": 'bar'}});
  var column2 = new Column('foo', Type.getType('string'), {"platformOptions": {"foo": 'foo', "foobar": 'foobar'}});
  var column3 = new Column('foo', Type.getType('string'), {"platformOptions": {"foo": 'foo', "bar": 'rab'}});
  var column4 = new Column('foo', Type.getType('string'));
  var comparator = new Comparator();

  it('should be the expected column name difference', function() {
    assert.deepEqual(comparator.diffColumn(column1, column2), []);
    assert.deepEqual(comparator.diffColumn(column2, column1), []);
    assert.deepEqual(comparator.diffColumn(column1, column3), ['bar']);
    assert.deepEqual(comparator.diffColumn(column3, column1), ['bar']);
    assert.deepEqual(comparator.diffColumn(column1, column4), []);
    assert.deepEqual(comparator.diffColumn(column4, column1), []);
  });
};

p.testComplexDiffColumn = function() {
  var column1 = new Column('foo', Type.getType('string'), {
    "platformOptions": {"foo": 'foo'},
    "customSchemaOptions": {"foo": 'bar'}
  });
  var column2 = new Column('foo', Type.getType('string'), {
    "platformOptions": {"foo": 'bar'}
  });
  var comparator = new Comparator();

  it('should be the columns without differences', function() {
    assert.deepEqual(comparator.diffColumn(column1, column2), []);
    assert.deepEqual(comparator.diffColumn(column2, column1), []);
  });
};

p.testComparesNamespaces = function() {
  var comparator = new Comparator();
  var fromSchema = new Schema();
  var toSchema = new Schema();

  gently.expect(toSchema, 'getNamespaces', function() {
    return ['bar', 'baz'];
  });

  gently.expect(fromSchema, 'hasNamespace', function(namespaceName) {
    assert.equal(namespaceName, 'bar');

    return true;
  });

  gently.expect(fromSchema, 'hasNamespace', function(namespaceName) {
    assert.equal(namespaceName, 'baz');

    return false;
  });

  gently.expect(fromSchema, 'getNamespaces', function() {
    return ['foo', 'bar'];
  });

  gently.expect(toSchema, 'hasNamespace', function(namespaceName) {
    assert.equal(namespaceName, 'foo');

    return false;
  });

  gently.expect(toSchema, 'hasNamespace', function(namespaceName) {
    assert.equal(namespaceName, 'bar');

    return true;
  });

  var expected = new SchemaDiff();

  expected.fromSchema = fromSchema;
  expected.newNamespaces = {"baz": 'baz'};
  expected.removedNamespaces = {"foo": 'foo'};

  it('should be the same SchemaDiff instances', function() {
    assert.deepEqual(comparator.compare(fromSchema, toSchema), expected);
  });
};

p.testCompareGuidColumns = function() {
  var comparator = new Comparator();
  var column1 = new Column('foo', Type.getType('guid'), {"comment": 'GUID 1'});
  var column2 = new Column(
    'foo',
    Type.getType('guid'),
    {"notnull": false, "length": '36', "fixed": true, "default": 'NEWID()', "comment": 'GUID 2.'}
  );

  it('should be the expected column name difference', function() {
    assert.deepEqual(comparator.diffColumn(column1, column2), ['notnull', 'default', 'comment']);
    assert.deepEqual(comparator.diffColumn(column2, column1), ['notnull', 'default', 'comment']);
  });
};

p.doTestCompareColumnComments = function(comment1, comment2, equals) {
  var column1 = new Column('foo', Type.getType('integer'), {"comment": comment1});
  var column2 = new Column('foo', Type.getType('integer'), {"comment": comment2});
  var comparator = new Comparator();
  var expectedDiff = equals ? [] : ['comment'];

  it('should be the expected column name difference', function() {
    var actualDiff = comparator.diffColumn(column1, column2);

    assert.deepEqual(actualDiff, expectedDiff);
  });

  it('should be the expected column name difference', function() {
    var actualDiff = comparator.diffColumn(column2, column1);

    assert.deepEqual(actualDiff, expectedDiff);
  });
};

p.testCompareColumnComments = function() {
  [
    [null, null, true],
    ['', '', true],
    [' ', ' ', true],
    ['0', '0', true],
    ['foo', 'foo', true],

    [null, '', true],
    [null, ' ', false],
    [null, '0', false],
    [null, 'foo', false],

    ['', ' ', false],
    ['', '0', false],
    ['', 'foo', false],

    [' ', '0', false],
    [' ', 'foo', false],

    ['0', 'foo', false]
  ].forEach(function(args) {
    this.doTestCompareColumnComments.call(this, args);
  }.bind(this));
};

(new ComparatorTest()).run();
