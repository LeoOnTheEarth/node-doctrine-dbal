var assert = require('chai').assert;
var UnitTest = require('../UnitTest.js');
var Table = require('../../lib/Schema/Table.js');
var Column = require('../../lib/Schema/Column.js');
var Index = require('../../lib/Schema/Index.js');
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var SchemaException = require('../../lib/Exception/SchemaException.js');
var DBALException = require('../../lib/Exception/DBALException.js');
var MySqlPlatform = require('../../lib/Platforms/MySqlPlatform.js');
var SqlitePlatform = require('../../lib/Platforms/SqlitePlatform.js');
var Type = require('../Mocks/Types/MockType.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var clone = require('clone');

/**
 * Class TableTest
 *
 * @constructor
 */
function TableTest() {}

inherits(TableTest, UnitTest);

var p = TableTest.prototype;

p.getName = function() {
  return 'Schema/Table';
};

p.testCreateWithInvalidTableName = function() {
  it('should throw DBALException', function() {
    assert.throws(function() {
      new Table('');
    }, DBALException);
  });
};

p.testGetName = function() {
  var table =  new Table('foo', {}, {}, []);

  it('should be the table name "foo"', function() {
    assert.equal(table.getName(), 'foo');
  });
};

p.testColumns = function() {
  var type = Type.getType('integer');
  var columns = {
    "foo": new Column('foo', type),
    "bar": new Column('bar', type)
  };
  var table = new Table('foo', columns, {}, []);

  it('should check columns in the table', function() {
    assert.isTrue(table.hasColumn('foo'));
    assert.isTrue(table.hasColumn('bar'));
    assert.isFalse(table.hasColumn('baz'));

    assert.instanceOf(table.getColumn('foo'), Column);
    assert.instanceOf(table.getColumn('bar'), Column);

    assert.equal(php.count(table.getColumns()), 2);
  });
};

p.testColumnsCaseInsensitive = function() {
  var table = new Table('foo');
  var column = table.addColumn('Foo', Type.getType('integer'));

  it('should check columns in the table', function() {
    assert.isTrue(table.hasColumn('Foo'));
    assert.isTrue(table.hasColumn('foo'));
    assert.isTrue(table.hasColumn('FOO'));

    assert.deepEqual(table.getColumn('Foo'), column);
    assert.deepEqual(table.getColumn('foo'), column);
    assert.deepEqual(table.getColumn('FOO'), column);
  });
};

p.testCreateColumn = function() {
  it('should check created column in the table', function() {
    var type = Type.getType('integer');
    var table = new Table('foo');

    assert.isFalse(table.hasColumn('bar'));

    table.addColumn('bar', Type.getType('integer'));

    assert.isTrue(table.hasColumn('bar'));
    assert.deepEqual(table.getColumn('bar').getType(), type);
  });
};

p.testDropColumn = function() {
  var type = Type.getType('integer');
  var columns = {
    "foo": new Column('foo', type),
    "bar": new Column('bar', type)
  };
  var table = new Table('foo', columns, {}, []);

  it('should check columns in the table', function() {
    assert.isTrue(table.hasColumn('foo'));
    assert.isTrue(table.hasColumn('bar'));

    table.dropColumn('foo').dropColumn('bar');

    assert.isFalse(table.hasColumn('foo'));
    assert.isFalse(table.hasColumn('bar'));
  });
};

p.testGetUnknownColumnThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo', {}, {}, []);

      table.getColumn('unknown');
    }, SchemaException);
  });
};

p.testAddColumnTwiceThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var type = Type.getType('integer');
      var columns = {
        "foo": new Column('foo', type),
        "bar": new Column('foo', type)
      };

      new Table('foo', columns, {}, []);
    }, SchemaException);
  });
};

p.testCreateIndex = function() {
  var type = Type.getType('integer');
  var columns = {"foo": new Column('foo', type), "bar": new Column('bar', type), "baz": new Column('baz', type)};
  var table = new Table('foo', columns);

  table.addIndex(['foo', 'bar'], 'foo_foo_bar_idx');
  table.addUniqueIndex(['bar', 'baz'], 'foo_bar_baz_uniq');

  it('should check indexes in the table', function() {
    assert.isTrue(table.hasIndex('foo_foo_bar_idx'));
    assert.isTrue(table.hasIndex('foo_bar_baz_uniq'));
  });
};

p.testIndexCaseInsensitive = function() {
  var type = Type.getType('integer');
  var columns = {
    "foo": new Column('foo', type),
    "bar": new Column('bar', type),
    "baz": new Column('baz', type)
  };
  var table = new Table('foo', columns);

  table.addIndex(['foo', 'bar', 'baz'], 'Foo_Idx');

  it('should check indexes in the table', function() {
    assert.isTrue(table.hasIndex('foo_idx'));
    assert.isTrue(table.hasIndex('Foo_Idx'));
    assert.isTrue(table.hasIndex('FOO_IDX'));
  });
};

p.testAddIndexes = function() {
  var type = Type.getType('integer');
  var columns = {
    "foo": new Column('foo', type),
    "bar": new Column('bar', type)
  };
  var indexes = {
    "the_primary": new Index('the_primary', ['foo'], true, true),
    "bar_idx": new Index('bar_idx', ['bar'], false, false)
  };
  var table = new Table('foo', columns, indexes, []);

  it('should check indexes in the table', function() {
    assert.isTrue(table.hasIndex('the_primary'));
    assert.isTrue(table.hasIndex('bar_idx'));
    assert.isFalse(table.hasIndex('some_idx'));

    assert.instanceOf(table.getPrimaryKey(), Index);
    assert.instanceOf(table.getIndex('the_primary'), Index);
    assert.instanceOf(table.getIndex('bar_idx'), Index);
  });
};

p.testGetUnknownIndexThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo', {}, {}, []);

      table.getIndex('unknownIndex');
    }, SchemaException);
  });
};

p.testAddTwoPrimaryThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var type = Type.getType('integer');
      var columns = {"foo": new Column('foo', type), "bar": new Column('bar', type)};
      var indexes = {
        "the_primary": new Index('the_primary', ['foo'], true, true),
        "other_primary": new Index('other_primary', ['bar'], true, true)
      };

      new Table('foo', columns, indexes, []);
    }, SchemaException);
  });
};

p.testAddTwoIndexesWithSameNameThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var type = Type.getType('integer');
      var columns = {"foo": new Column('foo', type), "bar": new Column('bar', type)};
      var indexes = {
        "an_idx": new Index('an_idx', ['foo'], false, false),
        "an_idx2": new Index('an_idx', ['bar'], false, false)
      };

      new Table('foo', columns, indexes, []);
    }, SchemaException);
  });
};

p.testConstraints = function() {
  var constraint = new ForeignKeyConstraint([], 'foo', []);
  var table = new Table('foo', {}, {}, [constraint]);
  var constraints = table.getForeignKeys();

  it('should check constraints in the table', function() {
    assert.equal(php.count(constraints), 1);
    assert.deepEqual(php.current(constraints), constraint);
  });
};

p.testOptions = function() {
  var table = new Table('foo', {}, {}, [], false, {'foo': 'bar'});

  it('should check options in the table', function() {
    assert.isTrue(table.hasOption('foo'));
    assert.equal(table.getOption('foo'), 'bar');
  });
};

p.testBuilderSetPrimaryKey = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.setPrimaryKey(['bar']);

  it('should check primary key in the table', function() {
    assert.isTrue(table.hasIndex('primary'));
    assert.instanceOf(table.getPrimaryKey(), Index);
    assert.isTrue(table.getIndex('primary').isUnique());
    assert.isTrue(table.getIndex('primary').isPrimary());
  });
};

p.testBuilderAddUniqueIndex = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addUniqueIndex(['bar'], 'my_idx');

  it('should check unique index in the table', function() {
    assert.isTrue(table.hasIndex('my_idx'));
    assert.isTrue(table.getIndex('my_idx').isUnique());
    assert.isFalse(table.getIndex('my_idx').isPrimary());
  });
};

p.testBuilderAddIndex= function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addIndex(['bar'], 'my_idx');

  it('should check unique index in the table', function() {
    assert.isTrue(table.hasIndex('my_idx'));
    assert.isFalse(table.getIndex('my_idx').isUnique());
    assert.isFalse(table.getIndex('my_idx').isPrimary());
  });
};

p.testBuilderAddIndexWithInvalidNameThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo');

      table.addColumn('bar', Type.getType('integer'));
      table.addIndex(['bar'], 'invalid name %&/');
    }, SchemaException);
  });
};

p.testBuilderAddIndexWithUnknownColumnThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo');

      table.addIndex(['bar'], 'invalidName');
    }, SchemaException);
  });
};

p.testBuilderOptions = function() {
  var table = new Table('foo');

  table.addOption('foo', 'bar');

  it('should check builder options in the table', function() {
    assert.isTrue(table.hasOption('foo'));
    assert.equal(table.getOption('foo'), 'bar');
  });
};

p.testAddForeignKeyConstraint_UnknownLocalColumn_ThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo');

      table.addColumn('id', Type.getType('integer'));

      var foreignTable = new Table('bar');

      foreignTable.addColumn('id', Type.getType('integer'));

      table.addForeignKeyConstraint(foreignTable, ['foo'], ['id']);
    }, SchemaException);
  });
};

p.testAddForeignKeyConstraint_UnknownForeignColumn_ThrowsException = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('foo');

      table.addColumn('id', Type.getType('integer'));

      var foreignTable = new Table('bar');

      foreignTable.addColumn('id', Type.getType('integer'));

      table.addForeignKeyConstraint(foreignTable, ['id'], ['foo']);
    }, SchemaException);
  });
};

p.testAddForeignKeyConstraint = function() {
  var table = new Table('foo');

  table.addColumn('id', Type.getType('integer'));

  var foreignTable = new Table('bar');

  foreignTable.addColumn('id', Type.getType('integer'));

  table.addForeignKeyConstraint(foreignTable, ['id'], ['id'], {"foo": "bar"});

  var constraints = table.getForeignKeys();

  it('should have one constraint in the table', function() {
    assert.equal(php.count(constraints), 1);
  });

  var constraint = php.current(constraints);

  it('should have expected constraint in the table', function() {
    assert.instanceOf(constraint, ForeignKeyConstraint);

    assert.isTrue(constraint.hasOption('foo'));
    assert.equal(constraint.getOption('foo'), 'bar');
  });
};

p.testAddIndexWithCaseSensitiveColumnProblem = function() {
  var table = new Table('foo');

  table.addColumn('id', Type.getType('integer'));
  table.addIndex(['ID'], 'my_idx');

  it('should have expected index in the table', function() {
    assert.isTrue(table.hasIndex('my_idx'));
    assert.deepEqual(table.getIndex('my_idx').getColumns(), ['ID']);
    assert.isTrue(table.getIndex('my_idx').spansColumns(['id']));
  });
};

p.testAddPrimaryKey_ColumnsAreExplicitlySetToNotNull = function() {
  var table = new Table('foo');
  var column = table.addColumn('id', Type.getType('integer'), {"notnull": false});

  it('should not have a "notnull" property in the table column', function() {
    assert.isFalse(column.getNotnull());
  });

  it('should have a "notnull" property in a primary key column', function() {
    table.setPrimaryKey(['id']);

    assert.isTrue(column.getNotnull());
  });
};

p.testAllowImplicitSchemaTableInAutoGeneratedIndexNames = function() {
  var table = new Table('foo.bar');

  table.addColumn('baz', Type.getType('integer'), {});
  table.addIndex(['baz']);

  it('should have one index in the table', function() {
    assert.equal(php.count(table.getIndexes()), 1);
  });
};

p.testAddForeignKeyIndexImplicitly = function() {
  var table = new Table('foo');

  table.addColumn('id', Type.getType('integer'));

  var foreignTable = new Table('bar');

  foreignTable.addColumn('id', Type.getType('integer'));

  table.addForeignKeyConstraint(foreignTable, ['id'], ['id'], {"foo": "bar"});

  var indexes = table.getIndexes();

  it('should have one index in the table', function() {
    assert.equal(php.count(indexes), 1);
  });

  var index = php.current(indexes);

  it('should have expected index in the table', function() {
    assert.isTrue(table.hasIndex(index.getName()));
    assert.deepEqual(index.getColumns(), ['id']);
  });
};

p.testAddForeignKeyDoesNotCreateDuplicateIndex = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addIndex(['bar'], 'bar_idx');

  var foreignTable = new Table('bar');

  foreignTable.addColumn('foo', Type.getType('integer'));

  table.addForeignKeyConstraint(foreignTable, ['bar'], ['foo']);

  it('should have expected index in the table', function() {
    assert.equal(php.count(table.getIndexes()), 1);
    assert.isTrue(table.hasIndex('bar_idx'));
    assert.deepEqual(table.getIndex('bar_idx').getColumns(), ['bar']);
  });
};

p.testAddForeignKeyAddsImplicitIndexIfIndexColumnsDoNotSpan = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addColumn('baz', Type.getType('string'));
  table.addColumn('bloo', Type.getType('string'));
  table.addIndex(['baz', 'bar'], 'composite_idx');
  table.addIndex(['bar', 'baz', 'bloo'], 'full_idx');

  var foreignTable = new Table('bar');

  foreignTable.addColumn('foo', Type.getType('integer'));
  foreignTable.addColumn('baz', Type.getType('string'));

  table.addForeignKeyConstraint(foreignTable, ['bar', 'baz'], ['foo', 'baz']);

  it('should have expected indexes in the table', function() {
    assert.equal(php.count(table.getIndexes()), 3);
    assert.isTrue(table.hasIndex('composite_idx'));
    assert.isTrue(table.hasIndex('full_idx'));
    assert.isTrue(table.hasIndex('idx_8c73652176ff8caa78240498'));
    assert.deepEqual(table.getIndex('composite_idx').getColumns(), ['baz', 'bar']);
    assert.deepEqual(table.getIndex('full_idx').getColumns(), ['bar', 'baz', 'bloo']);
    assert.deepEqual(table.getIndex('idx_8c73652176ff8caa78240498').getColumns(), ['bar', 'baz']);
  });
};

p.testOverrulingIndexDoesNotDropOverruledIndex = function() {
  var table = new Table('bar');

  table.addColumn('baz', Type.getType('integer'), {});
  table.addIndex(['baz']);

  var indexes = table.getIndexes();

  it('should have one index in the table', function() {
    assert.equal(php.count(indexes), 1);
  });

  it('should have one index in the table', function() {
    var index = php.current(indexes);
    table.addUniqueIndex(['baz']);

    assert.equal(php.count(table.getIndexes()), 2);
    assert.isTrue(table.hasIndex(index.getName()));
  });
};

p.testAllowsAddingDuplicateIndexesBasedOnColumns = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addIndex(['bar'], 'bar_idx');
  table.addIndex(['bar'], 'duplicate_idx');

  it('should have expected indexes in the table', function() {
    assert.equal(php.count(table.getIndexes()), 2);
    assert.isTrue(table.hasIndex('bar_idx'));
    assert.isTrue(table.hasIndex('duplicate_idx'));
    assert.deepEqual(table.getIndex('bar_idx').getColumns(), ['bar']);
    assert.deepEqual(table.getIndex('duplicate_idx').getColumns(), ['bar']);
  });
};

p.testAllowsAddingFulfillingIndexesBasedOnColumns = function() {
  var table = new Table('foo');

  table.addColumn('bar', Type.getType('integer'));
  table.addColumn('baz', Type.getType('string'));
  table.addIndex(['bar'], 'bar_idx');
  table.addIndex(['bar', 'baz'], 'fulfilling_idx');

  it('should have expected indexes in the table', function() {
    assert.equal(php.count(table.getIndexes()), 2);
    assert.isTrue(table.hasIndex('bar_idx'));
    assert.isTrue(table.hasIndex('fulfilling_idx'));
    assert.deepEqual(table.getIndex('bar_idx').getColumns(), ['bar']);
    assert.deepEqual(table.getIndex('fulfilling_idx').getColumns(), ['bar', 'baz']);
  });
};

p.testPrimaryKeyOverrulingUniqueIndexDoesNotDropUniqueIndex = function() {
  var table = new Table('bar');

  table.addColumn('baz', Type.getType('integer'));
  table.addUniqueIndex(['baz'], 'idx_unique');
  table.setPrimaryKey(['baz']);

  var indexes = table.getIndexes();

  it('should have expected indexes in the table', function() {
    assert.equal(php.count(indexes), 2, 'Table should only contain both the primary key table index and the unique one, even though it was overruled.');

    assert.isTrue(table.hasPrimaryKey());
    assert.isTrue(table.hasIndex('idx_unique'));
  });
};

p.testAddingFulfillingRegularIndexOverridesImplicitForeignKeyConstraintIndex = function() {
  var foreignTable = new Table('foreign');

  foreignTable.addColumn('id', Type.getType('integer'));

  var localTable = new Table('local');

  localTable.addColumn('id', Type.getType('integer'));
  localTable.addForeignKeyConstraint(foreignTable, ['id'], ['id']);

  it('should have one index in the table', function() {
    assert.equal(php.count(localTable.getIndexes()), 1);
  });

  it('should have expected indexes in the table', function() {
    localTable.addIndex(['id'], 'explicit_idx');

    assert.equal(php.count(localTable.getIndexes()), 1);
    assert.isTrue(localTable.hasIndex('explicit_idx'));
  });
};

p.testAddingFulfillingUniqueIndexOverridesImplicitForeignKeyConstraintIndex = function() {
  var foreignTable = new Table('foreign');

  foreignTable.addColumn('id', Type.getType('integer'));

  var localTable = new Table('local');

  localTable.addColumn('id', Type.getType('integer'));
  localTable.addForeignKeyConstraint(foreignTable, ['id'], ['id']);

  it('should have one index in the table', function() {
    assert.equal(php.count(localTable.getIndexes()), 1);
  });

  it('should have expected indexes in the table', function() {
    localTable.addUniqueIndex(['id'], 'explicit_idx');

    assert.equal(php.count(localTable.getIndexes()), 1);
    assert.isTrue(localTable.hasIndex('explicit_idx'));
  });
};

p.testAddingFulfillingPrimaryKeyOverridesImplicitForeignKeyConstraintIndex = function() {
  var foreignTable = new Table('foreign');

  foreignTable.addColumn('id', Type.getType('integer'));

  var localTable = new Table('local');

  localTable.addColumn('id', Type.getType('integer'));
  localTable.addForeignKeyConstraint(foreignTable, ['id'], ['id']);

  it('should have one index in the table', function() {
    assert.equal(php.count(localTable.getIndexes()), 1);
  });

  it('should have expected indexes in the table', function() {
    localTable.setPrimaryKey(['id'], 'explicit_idx');

    assert.equal(php.count(localTable.getIndexes()), 1);
    assert.isTrue(localTable.hasIndex('explicit_idx'));
  });
};

p.testAddingFulfillingExplicitIndexOverridingImplicitForeignKeyConstraintIndexWithSameNameDoesNotThrowException = function() {
  var foreignTable = new Table('foreign');

  foreignTable.addColumn('id', Type.getType('integer'));

  var localTable = new Table('local');

  localTable.addColumn('id', Type.getType('integer'));
  localTable.addForeignKeyConstraint(foreignTable, ['id'], ['id']);

  it('should have expected indexes in the table', function() {
    assert.equal(php.count(localTable.getIndexes()), 1);
    assert.isTrue(localTable.hasIndex('IDX_8BD688E8BF396750'));

    var implicitIndex = localTable.getIndex('IDX_8BD688E8BF396750');

    localTable.addIndex(['id'], 'IDX_8BD688E8BF396750');

    assert.equal(php.count(localTable.getIndexes()), 1);
    assert.isTrue(localTable.hasIndex('IDX_8BD688E8BF396750'));
    //assert.notDeepEqual(localTable.getIndex('IDX_8BD688E8BF396750'), implicitIndex);
  });
};

p.testQuotedTableName = function() {
  var table = new Table('`bar`');

  var mysqlPlatform = new MySqlPlatform();
  var sqlitePlatform = new SqlitePlatform();

  it('should have expected quoted table names', function() {
    assert.equal(table.getName(), 'bar');
    assert.equal(table.getQuotedName(mysqlPlatform), '`bar`');
    assert.equal(table.getQuotedName(sqlitePlatform), '"bar"');
  });
};

p.testTableHasPrimaryKey = function() {
  var table = new Table('test');

  it('should not have primary key in the table', function() {
    assert.isFalse(table.hasPrimaryKey());
  });

  it('should not have primary key in the table', function() {
    table.addColumn('foo', Type.getType('integer'));
    table.setPrimaryKey(['foo']);

    assert.isTrue(table.hasPrimaryKey());
  });
};

p.testAddIndexWithQuotedColumns = function() {
  var table = new Table('test');

  table.addColumn('"foo"', Type.getType('integer'));
  table.addColumn('bar', Type.getType('integer'));
  table.addIndex(['"foo"', '"bar"']);
};

p.testAddForeignKeyWithQuotedColumnsAndTable = function() {
  var table = new Table('test');

  table.addColumn('"foo"', Type.getType('integer'));
  table.addColumn('bar', Type.getType('integer'));
  table.addForeignKeyConstraint('"boing"', ['"foo"', '"bar"'], ['id']);
};

p.testQuoteSchemaPrefixed = function() {
  var table = new Table('`test`.`test`');

  it('should have correct quoted schema prefix', function() {
    assert.equal(table.getName(), 'test.test');
    assert.equal(table.getQuotedName(new MySqlPlatform()), '`test`.`test`');
  });
};

p.testFullQualifiedTableName = function() {
  it('should have correct full qualified table name', function() {
    var table = new Table('`test`.`test`');

    assert.equal(table.getFullQualifiedName('test'), 'test.test');
    assert.equal(table.getFullQualifiedName('other'), 'test.test');
  });

  it('should have correct full qualified table name', function() {
    var table = new Table('test');

    assert.equal(table.getFullQualifiedName('test'), 'test.test');
    assert.equal(table.getFullQualifiedName('other'), 'other.test');
  });
};

p.testDropIndex = function() {
  var table = new Table('test');

  table.addColumn('id', Type.getType('integer'));
  table.addIndex(['id'], 'idx');

  it('should have expected index in the table', function() {
    assert.isTrue(table.hasIndex('idx'));
  });

  it('should drop index "idx"', function() {
    table.dropIndex('idx');

    assert.isFalse(table.hasIndex('idx'));
  });
};

p.testDropPrimaryKey = function() {
  var table = new Table('test');

  table.addColumn('id', Type.getType('integer'));
  table.setPrimaryKey(['id']);

  it('should have expected primary key', function() {
    assert.isTrue(table.hasPrimaryKey());
  });

  it('should drop primary key', function() {
    table.dropPrimaryKey();

    assert.isFalse(table.hasPrimaryKey());
  });
};

p.testRenameIndex = function() {
  var table = new Table('test');

  table.addColumn('id', Type.getType('integer'));
  table.addColumn('foo', Type.getType('integer'));
  table.addColumn('bar', Type.getType('integer'));
  table.addColumn('baz', Type.getType('integer'));
  table.setPrimaryKey(['id'], 'pk');
  table.addIndex(['foo'], 'idx', ['flag']);
  table.addUniqueIndex(['bar', 'baz'], 'uniq');

  it('should test index renaming', function() {
    // Rename to custom name.
    assert.deepEqual(table.renameIndex('pk', 'pk_new'), table);
    assert.deepEqual(table.renameIndex('idx', 'idx_new'), table);
    assert.deepEqual(table.renameIndex('uniq', 'uniq_new'), table);

    assert.isTrue(table.hasPrimaryKey());
    assert.isTrue(table.hasIndex('pk_new'));
    assert.isTrue(table.hasIndex('idx_new'));
    assert.isTrue(table.hasIndex('uniq_new'));

    assert.isFalse(table.hasIndex('pk'));
    assert.isFalse(table.hasIndex('idx'));
    assert.isFalse(table.hasIndex('uniq'));

    assert.deepEqual(table.getPrimaryKey(), new Index('pk_new', ['id'], true, true));
    assert.deepEqual(table.getIndex('pk_new'), new Index('pk_new', ['id'], true, true));
    assert.deepEqual(
      table.getIndex('idx_new'),
      new Index('idx_new', ['foo'], false, false, ['flag'])
    );
    assert.deepEqual(table.getIndex('uniq_new'), new Index('uniq_new', ['bar', 'baz'], true));

    // Rename to auto-generated name.
    assert.deepEqual(table.renameIndex('pk_new', null), table);
    assert.deepEqual(table.renameIndex('idx_new', null), table);
    assert.deepEqual(table.renameIndex('uniq_new', null), table);

    assert.isTrue(table.hasPrimaryKey());
    assert.isTrue(table.hasIndex('primary'));
    assert.isTrue(table.hasIndex('IDX_D87F7E0C8C736521'));
    assert.isTrue(table.hasIndex('UNIQ_D87F7E0C76FF8CAA78240498'));

    assert.isFalse(table.hasIndex('pk_new'));
    assert.isFalse(table.hasIndex('idx_new'));
    assert.isFalse(table.hasIndex('uniq_new'));

    assert.deepEqual(table.getPrimaryKey(), new Index('primary', ['id'], true, true));
    assert.deepEqual(table.getIndex('primary'), new Index('primary', ['id'], true, true));
    assert.deepEqual(
      table.getIndex('IDX_D87F7E0C8C736521'),
      new Index('IDX_D87F7E0C8C736521', ['foo'], false, false, ['flag'])
    );
    assert.deepEqual(
      table.getIndex('UNIQ_D87F7E0C76FF8CAA78240498'),
      new Index('UNIQ_D87F7E0C76FF8CAA78240498', ['bar', 'baz'], true)
    );

    // Rename to same name (changed case).
    assert.deepEqual(table.renameIndex('primary', 'PRIMARY'), table);
    assert.deepEqual(table.renameIndex('IDX_D87F7E0C8C736521', 'idx_D87F7E0C8C736521'), table);
    assert.deepEqual(table.renameIndex('UNIQ_D87F7E0C76FF8CAA78240498', 'uniq_D87F7E0C76FF8CAA78240498'), table);

    assert.isTrue(table.hasPrimaryKey());
    assert.isTrue(table.hasIndex('primary'));
    assert.isTrue(table.hasIndex('IDX_D87F7E0C8C736521'));
    assert.isTrue(table.hasIndex('UNIQ_D87F7E0C76FF8CAA78240498'));
  });
};

p.testThrowsExceptionOnRenamingNonExistingIndex = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('test');

      table.addColumn('id', Type.getType('integer'));
      table.addIndex(['id'], 'idx');

      table.renameIndex('foo', 'bar');
    }, SchemaException);
  });
};

p.testThrowsExceptionOnRenamingToAlreadyExistingIndex = function() {
  it('should throw SchemaException', function() {
    assert.throws(function() {
      var table = new Table('test');

      table.addColumn('id', Type.getType('integer'));
      table.addColumn('foo', Type.getType('integer'));
      table.addIndex(['id'], 'idx_id');
      table.addIndex(['foo'], 'idx_foo');

      table.renameIndex('idx_id', 'idx_foo');
    }, SchemaException);
  });
};

p.testNormalizesColumnNames = function() {
  [
    'foo',
    'FOO',
    '`foo`',
    '`FOO`',
    '"foo"',
    '"FOO"',
    '"foo"',
    '"FOO"'
  ].forEach(this.doTestNormalizesColumnNames);
};

/**
 * @param {string} assetName
 */
p.doTestNormalizesColumnNames = function(assetName) {
  var table = new Table('test');

  table.addColumn(assetName, Type.getType('integer'));
  table.addIndex([assetName], assetName);
  table.addForeignKeyConstraint('test', [assetName], [assetName], {}, assetName);

  it('should test normalize colum names', function() {
    assert.isTrue(table.hasColumn(assetName));
    assert.isTrue(table.hasColumn('foo'));
    assert.instanceOf(table.getColumn(assetName), Column);
    assert.instanceOf(table.getColumn('foo'), Column);

    assert.isTrue(table.hasIndex(assetName));
    assert.isTrue(table.hasIndex('foo'));
    assert.instanceOf(table.getIndex(assetName), Index);
    assert.instanceOf(table.getIndex('foo'), Index);

    assert.isTrue(table.hasForeignKey(assetName));
    assert.isTrue(table.hasForeignKey('foo'));
    assert.instanceOf(table.getForeignKey(assetName), ForeignKeyConstraint);
    assert.instanceOf(table.getForeignKey('foo'), ForeignKeyConstraint);

    table.renameIndex(assetName, assetName);
    assert.isTrue(table.hasIndex(assetName));
    assert.isTrue(table.hasIndex('foo'));

    table.renameIndex(assetName, 'foo');
    assert.isTrue(table.hasIndex(assetName));
    assert.isTrue(table.hasIndex('foo'));

    table.renameIndex('foo', assetName);
    assert.isTrue(table.hasIndex(assetName));
    assert.isTrue(table.hasIndex('foo'));

    table.renameIndex(assetName, 'bar');
    assert.isFalse(table.hasIndex(assetName));
    assert.isFalse(table.hasIndex('foo'));
    assert.isTrue(table.hasIndex('bar'));

    table.renameIndex('bar', assetName);

    table.dropColumn(assetName);
    table.dropIndex(assetName);
    table.removeForeignKey(assetName);

    assert.isFalse(table.hasColumn(assetName));
    assert.isFalse(table.hasColumn('foo'));
    assert.isFalse(table.hasIndex(assetName));
    assert.isFalse(table.hasIndex('foo'));
    assert.isFalse(table.hasForeignKey(assetName));
    assert.isFalse(table.hasForeignKey('foo'));
  });
};

(new TableTest()).run();
