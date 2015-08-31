var assert = require('chai').assert;
var UnitTest = require('../UnitTest.js');
var Schema = require('../../lib/Schema/Schema.js');
var Sequence = require('../../lib/Schema/Sequence.js');
var Table = require('../../lib/Schema/Table.js');
var AbstractVisitor = require('../../lib/Schema/Visitor/AbstractVisitor.js');
var SchemaConfig = require('../../lib/Schema/SchemaConfig.js');
var SchemaException = require('../../lib/Exception/SchemaException.js');
var Type = require('../Mocks/Types/MockType.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var clone = require('clone');
var gently = new(require('gently'));

/**
 * Class SchemaTest
 *
 * @constructor
 */
function SchemaTest() {}

inherits(SchemaTest, UnitTest);

var p = SchemaTest.prototype;

p.getName = function() {
  return 'Schema/Schema';
};

p.testAddTable = function() {
  var tableName = 'public.foo';
  var table = new Table(tableName);
  var schema = new Schema({"table": table});
  var tables = schema.getTables();

  it('should have given table name "' + tableName +'"', function() {
    assert.isTrue(schema.hasTable(tableName));
    assert.property(tables, tableName);
  });

  it('should be the same table instance', function() {
    assert.strictEqual(tables[tableName], table);
    assert.strictEqual(schema.getTable(tableName), table);
  });
};

p.testTableMatchingCaseInsensitive = function() {
  var table = new Table('Foo');
  var schema = new Schema({"table": table});

  it('should have given table name "Foo"', function() {
    assert.isTrue(schema.hasTable('foo'));
    assert.isTrue(schema.hasTable('FOO'));
  });

  it('should be the same table instance', function() {
    assert.strictEqual(schema.getTable('FOO'), table);
    assert.strictEqual(schema.getTable('foo'), table);
    assert.strictEqual(schema.getTable('Foo'), table);
  });
};

p.testGetUnknownTableThrowsException = function() {
  it('should throw a SchemaException', function() {
    assert.throws(function() {
      var schema = new Schema();

      schema.getTable("unknown");
    }, SchemaException);
  });
};

p.testCreateTableTwiceThrowsException = function() {
  it('should throw a SchemaException', function() {
    assert.throws(function() {
      var tableName = 'foo';
      var table = new Table(tableName);
      var tables = {"tb1": table, "tb2": table};
      new Schema(tables);
    }, SchemaException);
  });
};

p.testRenameTable = function() {
  var tableName = 'foo';
  var table = new Table(tableName);
  var schema = new Schema({"table": table});

  it('should have given table name "Foo"', function() {
    assert.isTrue(schema.hasTable('foo'));
  });

  it('should have given table name "bar"', function() {
    schema.renameTable('foo', 'bar');

    assert.isFalse(schema.hasTable('foo'));
    assert.isTrue(schema.hasTable('bar'));
    assert.strictEqual(schema.getTable('bar'), table);
  });
};

p.testDropTable = function() {
  var tableName = 'foo';
  var table = new Table(tableName);
  var schema = new Schema({"table": table});

  it('should have given table name "Foo"', function() {
    assert.isTrue(schema.hasTable('foo'));
  });

  it('should not have given table name "Foo"', function() {
    schema.dropTable('foo');

    assert.isFalse(schema.hasTable('foo'));
  });
};

p.testCreateTable = function() {
  it('should not have given table name "Foo"', function() {
    var schema = new Schema();

    assert.isFalse(schema.hasTable('foo'));
  });

  it('should have given table name "Foo"', function() {
    var schema = new Schema();
    var table = schema.createTable('foo');

    assert.instanceOf(table, Table);
    assert.equal(table.getName(), 'foo');
    assert.isTrue(schema.hasTable('foo'));
  });
};

p.testAddSequences = function() {
  var sequence = new Sequence('a_seq', 1, 1);
  var schema = new Schema({}, [sequence]);

  it('should not have given sequence name "a_seq"', function() {
    assert.isTrue(schema.hasSequence('a_seq'));
    assert.instanceOf(schema.getSequence('a_seq'), Sequence);
  });

  it('should not have given sequence name "public.a_seq"', function() {
    var sequences = schema.getSequences();

    assert.property(sequences, 'public.a_seq');
  });
};

p.testSequenceAccessCaseInsensitive = function() {
  var sequence = new Sequence('a_Seq');
  var schema = new Schema({}, [sequence]);

  it('should not have given sequence name "a_seq"', function() {
    assert.isTrue(schema.hasSequence('a_seq'));
    assert.isTrue(schema.hasSequence('a_Seq'));
    assert.isTrue(schema.hasSequence('A_SEQ'));
  });

  it('should be the same sequence instance', function() {
    assert.strictEqual(schema.getSequence('a_seq'), sequence);
    assert.strictEqual(schema.getSequence('a_Seq'), sequence);
    assert.strictEqual(schema.getSequence('A_SEQ'), sequence);
  });
};

p.testGetUnknownSequenceThrowsException = function() {
  it('should throw a SchemaException', function() {
    assert.throws(function() {
      var schema = new Schema();

      schema.getSequence('unknown');
    }, SchemaException);
  });
};

p.testCreateSequence = function() {
  var schema = new Schema();
  var sequence = schema.createSequence('a_seq', 10, 20);

  it('should have expected schema & sequence instances', function() {
    assert.equal(sequence.getName(), 'a_seq');
    assert.equal(sequence.getAllocationSize(), 10);
    assert.equal(sequence.getInitialValue(), 20);

    assert.isTrue(schema.hasSequence('a_seq'));
    assert.instanceOf(schema.getSequence('a_seq'), Sequence);
  });

  it('should have given sequence name "public.a_seq"', function() {
    var sequences = schema.getSequences();

    assert.property(sequences, 'public.a_seq');
  });
};

p.testDropSequence = function() {
  it('should not have given sequence name "a_seq"', function() {
    var sequence = new Sequence("a_seq", 1, 1);
    var schema = new Schema({}, [sequence]);

    schema.dropSequence('a_seq');

    assert.isFalse(schema.hasSequence('a_seq'));
  });
};

p.testAddSequenceTwiceThrowsException = function() {
  it('should throw a SchemaException', function() {
    assert.throws(function() {
      var sequence = new Sequence('a_seq', 1, 1);
      new Schema({}, [sequence, sequence]);
    }, SchemaException);
  });
};

p.testConfigMaxIdentifierLength = function() {
  var schemaConfig = new SchemaConfig();

  schemaConfig.setMaxIdentifierLength(5);

  var schema = new Schema({}, [], schemaConfig);
  var table = schema.createTable('smalltable');

  table.addColumn('long_id', Type.getType('integer'));
  table.addIndex(['long_id']);

  var index = php.current(table.getIndexes());

  it('should have the same length of index name', function() {
    assert.equal(5, index.getName().length);
  });
};

p.testDeepClone = function() {
  var schema = new Schema();
  var sequence = schema.createSequence('baz');

  var tableA = schema.createTable('foo');

  tableA.addColumn('id', Type.getType('integer'));

  var tableB = schema.createTable('bar');

  tableB.addColumn('id', Type.getType('integer'));
  tableB.addColumn('foo_id', Type.getType('integer'));
  tableB.addForeignKeyConstraint(tableA, ['foo_id'], ['id']);

  /** @type {Schema} schemaNew */
  var schemaNew = clone(schema);

  it('should be cloned as different instances', function() {
    assert.notStrictEqual(schemaNew.getSequence('baz'), sequence);

    assert.notStrictEqual(schemaNew.getTable('foo'), tableA);
    assert.notStrictEqual(schemaNew.getTable('foo').getColumn('id'), tableA.getColumn('id'));

    assert.notStrictEqual(schemaNew.getTable('bar'), tableB);
    assert.notStrictEqual(schemaNew.getTable('bar').getColumn('id'), tableB.getColumn('id'));
  });

  var fk = schemaNew.getTable('bar').getForeignKeys();

  fk = php.current(fk);

  it('should be the same foreign keys', function() {
    assert.deepEqual(fk._localTable, schemaNew.getTable('bar'));
  });
};

p.testHasTableForQuotedAsset = function() {
  var schema = new Schema();

  var tableA = schema.createTable('foo');

  tableA.addColumn('id', Type.getType('integer'));

  it('should have "foo" table instance', function() {
    assert.isTrue(schema.hasTable('`foo`'));
  });
};

p.testHasNamespace = function() {
  it('should match given namespace name', function() {
    var schema = new Schema();

    assert.isFalse(schema.hasNamespace('foo'));

    schema.createTable('foo');

    assert.isFalse(schema.hasNamespace('foo'));

    schema.createTable('bar.baz');

    assert.isFalse(schema.hasNamespace('baz'));
    assert.isTrue(schema.hasNamespace('bar'));
    assert.isFalse(schema.hasNamespace('tab'));

    schema.createTable('tab.taz');

    assert.isTrue(schema.hasNamespace('tab'));
  });
};

p.testCreatesNamespace = function() {
  it('should not have "foo" namespace', function() {
    var schema = new Schema();

    assert.isFalse(schema.hasNamespace('foo'));
  });

  it('should have "foo" namespace', function() {
    var schema = new Schema();

    schema.createNamespace('foo');

    assert.isTrue(schema.hasNamespace('foo'));
    assert.isTrue(schema.hasNamespace('FOO'));
    assert.isTrue(schema.hasNamespace('`foo`'));
    assert.isTrue(schema.hasNamespace('`FOO`'));
  });

  it('should have "bar" namespace', function() {
    var schema = new Schema();

    schema.createNamespace('`bar`');

    assert.isTrue(schema.hasNamespace('bar'));
    assert.isTrue(schema.hasNamespace('BAR'));
    assert.isTrue(schema.hasNamespace('`bar`'));
    assert.isTrue(schema.hasNamespace('`BAR`'));
  });

  it('should have the same namespaces', function() {
    var schema = new Schema();

    schema.createNamespace('foo');
    schema.createNamespace('`bar`');

    assert.deepEqual({foo: 'foo', bar: '`bar`'}, schema.getNamespaces());
  });
};

p.testThrowsExceptionOnCreatingNamespaceTwice = function() {
  it('should throw a SchemaException', function() {
    var schema = new Schema();

    schema.createNamespace('foo');

    assert.throws(function() {
      schema.createNamespace('foo');
    }, SchemaException);
  });
};

p.testCreatesNamespaceThroughAddingTableImplicitly = function() {
  it('should not have "foo" namespace', function() {
    var schema = new Schema();

    assert.isFalse(schema.hasNamespace('foo'));
  });

  it('should not have "foo" and "baz" namespace', function() {
    var schema = new Schema();

    schema.createTable('baz');

    assert.isFalse(schema.hasNamespace('foo'));
    assert.isFalse(schema.hasNamespace('baz'));
  });

  it('should have "foo" namespace, but not have "bar" namespace', function() {
    var schema = new Schema();

    schema.createTable('foo.bar');

    assert.isTrue(schema.hasNamespace('foo'));
    assert.isFalse(schema.hasNamespace('bar'));
  });

  it('should have "baz" namespace, but not have "bloo" namespace', function() {
    var schema = new Schema();

    schema.createTable('`baz`.bloo');

    assert.isTrue(schema.hasNamespace('baz'));
    assert.isFalse(schema.hasNamespace('bloo'));
  });

  it('should have "baz" namespace, but not have "moo" namespace', function() {
    var schema = new Schema();

    schema.createTable('`baz`.moo');

    assert.isTrue(schema.hasNamespace('baz'));
    assert.isFalse(schema.hasNamespace('moo'));
  });
};

p.testCreatesNamespaceThroughAddingSequenceImplicitly = function() {
  it('should not have "foo" namespace', function() {
    var schema = new Schema();

    assert.isFalse(schema.hasNamespace('foo'));
  });

  it('should not have "foo" and "baz" namespace', function() {
    var schema = new Schema();

    schema.createSequence('baz');

    assert.isFalse(schema.hasNamespace('foo'));
    assert.isFalse(schema.hasNamespace('baz'));
  });

  it('should have "foo" namespace, but not have "bar" namespace', function() {
    var schema = new Schema();

    schema.createSequence('foo.bar');

    assert.isTrue(schema.hasNamespace('foo'));
    assert.isFalse(schema.hasNamespace('bar'));
  });

  it('should have "baz" namespace, but not have "bloo" namespace', function() {
    var schema = new Schema();

    schema.createSequence('`baz`.bloo');

    assert.isTrue(schema.hasNamespace('baz'));
    assert.isFalse(schema.hasNamespace('bloo'));
  });

  it('should have "baz" namespace, but not have "moo" namespace', function() {
    var schema = new Schema();

    schema.createSequence('`baz`.moo');

    assert.isTrue(schema.hasNamespace('baz'));
    assert.isFalse(schema.hasNamespace('moo'));
  });
};

p.testVisitsVisitor = function() {
  var schema = new Schema();
  var visitor = new AbstractVisitor();

  schema.createNamespace('foo');
  schema.createNamespace('bar');

  schema.createTable('baz');
  schema.createTable('bla.bloo');

  schema.createSequence('moo');
  schema.createSequence('war');

  gently.expect(visitor, 'acceptSchema', function(schema_) {
    assert.deepEqual(schema_, schema);
  });

  gently.expect(visitor, 'acceptTable', 2, function(table_) {});
  gently.expect(visitor, 'acceptSequence', 2, function(sequence_) {});

  it('should return null', function() {
    assert.isUndefined(schema.visit(visitor));
  });
};

p.testVisitsNamespaceVisitor = function() {
  var schema = new Schema();
  var visitor = new AbstractVisitor();

  schema.createNamespace('foo');
  schema.createNamespace('bar');

  schema.createTable('baz');
  schema.createTable('bla.bloo');

  schema.createSequence('moo');
  schema.createSequence('war');

  gently.expect(visitor, 'acceptSchema', 1, function(schema_) {
    assert.deepEqual(schema_, schema);
  });

  gently.expect(visitor, 3, 'acceptNamespace');
  gently.expect(visitor, 2, 'acceptTable');
  gently.expect(visitor, 2, 'acceptSequence');

  it('should return null', function() {
    assert.isUndefined(schema.visit(visitor));
  });
};

(new SchemaTest()).run();
