module.exports = AbstractPlatformTestCase;

var assert = require('chai').assert;
var UnitTest = require('../UnitTest.js');
var Table = require('../../lib/Schema/Table.js');
var TableDiff = require('../../lib/Schema/TableDiff.js');
var Index = require('../../lib/Schema/Index.js');
var Column = require('../../lib/Schema/Column.js');
var ColumnDiff = require('../../lib/Schema/ColumnDiff.js');
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var Comparator = require('../../lib/Schema/Comparator.js');
var AbstractKeywords = require('../../lib/Platforms/Keywords/AbstractKeywords.js');
var AbstractPlatform = require('../../lib/Platforms/AbstractPlatform.js');
var MethodNotImplementException = require('../../lib/Exception/MethodNotImplementException.js');
var InvalidArgumentException = require('../../lib/Exception/InvalidArgumentException.js');
var DBALException = require('../../lib/Exception/DBALException.js');
var inherits = require('util').inherits;
var validArg = require('../../lib/util.js').validArg;

/**
 * Class AbstractPlatformTestCase
 *
 * @constructor
 */
function AbstractPlatformTestCase()
{
  /**
   * @type {AbstractPlatform}
   *
   * @access private
   */
  this._platform = null;
}

inherits(AbstractPlatformTestCase, UnitTest);

var p = AbstractPlatformTestCase.prototype;

p.getName = function() {
  return 'Platform/AbstractPlatform';
};

p.setUp = function() {
  this._platform = this.createPlatform();
};

p.createPlatform = function() {
  throw new MethodNotImplementException('createPlatform');
};

p.getType = function(type) {
  throw new MethodNotImplementException('getType');
};

p.testQuoteIdentifier = function() {
  if (this._platform.getName() === 'mssql') {
    it.skip('Not working this way on mssql.');
    return;
  }

  var c = this._platform.getIdentifierQuoteCharacter();

  it('should equal correct quoted strings', function() {
    this._platform.quoteIdentifier('test').should.equal(c + 'test' + c);
    this._platform.quoteIdentifier('test.test').should.equal(c + 'test' + c + '.' + c + 'test' + c);
    this._platform.quoteIdentifier(c).should.equal(c + c + c + c);
  }.bind(this));
};

p.testQuoteSingleIdentifier = function() {
  if (this._platform.getName() === 'mssql') {
    it.skip('Not working this way on mssql.');
    return;
  }

  var c = this._platform.getIdentifierQuoteCharacter();

  it('should equal correct single quoted strings', function() {
    this._platform.quoteSingleIdentifier('test').should.equal(c + 'test' + c);
    this._platform.quoteSingleIdentifier('test.test').should.equal(c + 'test.test' + c);
    this._platform.quoteSingleIdentifier(c).should.equal(c + c + c + c);
  }.bind(this));
};

p.testReturnsForeignKeyReferentialActionSQL = function() {
  var testCases = [
    ['CASCADE', 'CASCADE'],
    ['SET NULL', 'SET NULL'],
    ['NO ACTION', 'NO ACTION'],
    ['RESTRICT', 'RESTRICT'],
    ['SET DEFAULT', 'SET DEFAULT'],
    ['CaScAdE', 'CASCADE']
  ];

  testCases.forEach(function(testCase) {
    var action = testCase[0];
    var expectedSQL = testCase[1];

    it('should equal the same sql with action "' + action + '"', function() {
      this._platform.getForeignKeyReferentialActionSQL(action).should.equal(expectedSQL);
    }.bind(this));
  }.bind(this));
};

p.testGetInvalidForeignKeyReferentialActionSQL = function () {
  it('should throws an "InvalidArgumentException" exception', function() {
    assert.throws(function () {
      this._platform.getForeignKeyReferentialActionSQL('unknown');
    }.bind(this), InvalidArgumentException);
  }.bind(this));
};

p.testCreateWithNoColumns = function() {
  var table = new Table('test');

  it('should throws an "DBALException" exception', function() {
    assert.throws(function () {
      this._platform.getCreateTableSQL(table);
    }.bind(this), DBALException);
  }.bind(this));
};

p.testGeneratesTableCreationSql = function() {
  var table = new Table('test');

  table.addColumn('id', this.getType('integer'), {notnull: true, autoincrement: true});
  table.addColumn('test', this.getType('string'), {notnull: false, length: 255});
  table.setPrimaryKey(['id']);

  var sql = this._platform.getCreateTableSQL(table);

  it('should be the same SQL declaration', function() {
    assert.equal(sql[0], this.getGenerateTableSql());
  }.bind(this));
};

p.getGenerateTableSql = function() {
  throw new MethodNotImplementException('getGenerateTableSql');
};

p.testGenerateTableWithMultiColumnUniqueIndex = function() {
  var table = new Table('test');

  table.addColumn('foo', this.getType('string'), {notnull: false, length: 255});
  table.addColumn('bar', this.getType('string'), {notnull: false, length: 255});
  table.addUniqueIndex(['foo', 'bar']);

  var sql = this._platform.getCreateTableSQL(table);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(sql, this.getGenerateTableWithMultiColumnUniqueIndexSql());
  }.bind(this));
};

p.getGenerateTableWithMultiColumnUniqueIndexSql = function() {
  throw new MethodNotImplementException('getGenerateTableWithMultiColumnUniqueIndexSql');
};

p.testGeneratesIndexCreationSql = function() {
  var indexDef = new Index('my_idx', ['user_name', 'last_login']);

  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getCreateIndexSQL(indexDef, 'mytable'),
      this.getGenerateIndexSql()
    );
  }.bind(this));
};

p.getGenerateIndexSql = function() {
  throw new MethodNotImplementException('getGenerateIndexSql');
};

p.testGeneratesUniqueIndexCreationSql = function() {
  var indexDef = new Index('index_name', ['test', 'test2'], true);
  var sql = this._platform.getCreateIndexSQL(indexDef, 'test');

  it('should be the same SQL declaration', function() {
    assert.equal(sql, this.getGenerateUniqueIndexSql());
  }.bind(this));
};

p.getGenerateUniqueIndexSql = function() {
  throw new MethodNotImplementException('getGenerateUniqueIndexSql');
};

p.testGeneratesPartialIndexesSqlOnlyWhenSupportingPartialIndexes = function() {
  var where = 'test IS NULL AND test2 IS NOT NULL';
  var indexDef = new Index('name', ['test', 'test2'], false, false, [], {where: where});
  var uniqueIndex = new Index('name', ['test', 'test2'], true, false, [], {where: where});
  var expected = ' WHERE ' + where;
  var actuals = [];

  if (this.supportsInlineIndexDeclaration()) {
    actuals.push(this._platform.getIndexDeclarationSQL('name', indexDef));
  }

  actuals.push(this._platform.getUniqueConstraintDeclarationSQL('name', uniqueIndex));
  actuals.push(this._platform.getCreateIndexSQL(indexDef, 'table'));

  actuals.forEach(function(actual) {
    it('should be the same SQL WHERE declaration', function() {
      if (this._platform.supportsPartialIndexes()) {
        assert.match(actual, new RegExp(expected + '$'), 'WHERE clause should be present');
      } else {
        assert.notInclude(actual, new RegExp(expected + '$'), 'WHERE clause should NOT be present');
      }
    }.bind(this));
  }.bind(this));
};

p.testGeneratesForeignKeyCreationSql = function() {
  var fk = new ForeignKeyConstraint(['fk_name_id'], 'other_table', ['id'], '');
  var sql = this._platform.getCreateForeignKeySQL(fk, 'test');

  it('should be the same SQL declaration', function() {
    assert.equal(this.getGenerateForeignKeySql(), sql);
  }.bind(this));
};

p.getGenerateForeignKeySql = function() {
  throw new MethodNotImplementException('getGenerateForeignKeySql');
};

p.testGeneratesConstraintCreationSql = function() {
  var idx, pk, fk, sql;

  it('should be the same SQL declaration', function() {
    idx = new Index('constraint_name', ['test'], true, false);
    sql = this._platform.getCreateConstraintSQL(idx, 'test');

    assert.equal(sql, this.getGenerateConstraintUniqueIndexSql());
  }.bind(this));

  it('should be the same SQL declaration', function() {
    pk = new Index('constraint_name', ['test'], true, true);
    sql = this._platform.getCreateConstraintSQL(pk, 'test');

    assert.equal(sql, this.getGenerateConstraintPrimaryIndexSql());
  }.bind(this));

  it('should be the same SQL declaration', function() {
    fk = new ForeignKeyConstraint(['fk_name'], 'foreign', ['id'], 'constraint_fk');
    sql = this._platform.getCreateConstraintSQL(fk, 'test');

    assert.equal(this.getGenerateConstraintForeignKeySql(fk), sql);
  }.bind(this));
};

p.testGeneratesForeignKeySqlOnlyWhenSupportingForeignKeys = function() {
  var fk = new ForeignKeyConstraint(['fk_name'], 'foreign', ['id'], 'constraint_fk');

  if (this._platform.supportsForeignKeyConstraints()) {
    it('should be a string value', function() {
      assert.isString(this._platform.getCreateForeignKeySQL(fk, 'test'));
    }.bind(this));
  } else {
    it('should throw "DBALException" exception', function() {
      assert.throws(function () {
        this._platform.getCreateForeignKeySQL(fk, 'test');
      }.bind(this), DBALException);
    }.bind(this));
  }
};

p.getBitAndComparisonExpressionSql = function(value1, value2) {
  return '(' + value1 + ' & ' + value2 + ')';
};

p.testGeneratesBitAndComparisonExpressionSql = function() {
  var sql = this._platform.getBitAndComparisonExpression('2', '4');

  it('should be the same SQL declaration', function() {
    assert.equal(sql, this.getBitAndComparisonExpressionSql(2, 4));
  }.bind(this));
};

p.getBitOrComparisonExpressionSql = function(value1, value2) {
  return '(' + value1 + ' | ' + value2 + ')';
};

p.testGeneratesBitOrComparisonExpressionSql = function() {
  var sql = this._platform.getBitOrComparisonExpression('2', '4');

  it('should be the same SQL declaration', function() {
    assert.equal(sql, this.getBitOrComparisonExpressionSql(2, 4));
  }.bind(this));
};

p.getGenerateConstraintUniqueIndexSql = function() {
  return 'ALTER TABLE test ADD CONSTRAINT constraint_name UNIQUE (test)';
};

p.getGenerateConstraintPrimaryIndexSql = function() {
  return 'ALTER TABLE test ADD CONSTRAINT constraint_name PRIMARY KEY (test)';
};

p.getGenerateConstraintForeignKeySql = function(fk) {
  validArg(fk, 'fk', ForeignKeyConstraint);

  var quotedForeignTable = fk.getQuotedForeignTableName(this._platform);

  return 'ALTER TABLE test ADD CONSTRAINT constraint_fk FOREIGN KEY (fk_name) REFERENCES ' + quotedForeignTable + ' (id)';
};

p.getGenerateAlterTableSql = function() {
  throw new MethodNotImplementException('getGenerateAlterTableSql');
};

p.testGeneratesTableAlterationSql = function() {
  var expectedSql = this.getGenerateAlterTableSql();

  var table = new Table('mytable');

  table.addColumn('id', this.getType('integer'), {autoincrement: true});
  table.addColumn('foo', this.getType('integer'));
  table.addColumn('bar', this.getType('string'));
  table.addColumn('bloo', this.getType('boolean'), {"length": 1});

  table.setPrimaryKey(['id']);

  var tableDiff = new TableDiff('mytable');

  tableDiff.fromTable = table;
  tableDiff.newName = 'userlist';
  tableDiff.addedColumns['quota'] = new Column('quota', this.getType('integer'), {notnull: false});
  tableDiff.removedColumns['foo'] = new Column('foo', this.getType('integer'));

  tableDiff.changedColumns['bar'] = new ColumnDiff(
    'bar',
    new Column(
      'baz',
      this.getType('string'),
      {"default": 'def'}
    ),
    ['type', 'notnull', 'default']
  );

  tableDiff.changedColumns['bloo'] = new ColumnDiff(
    'bloo',
    new Column(
      'bloo',
      this.getType('boolean'),
      {"default": false, "length": 1}
    ),
    ['type', 'notnull', 'default']
  );

  it('should be the same SQL declaration', function() {
    var sql = this._platform.getAlterTableSQL(tableDiff);

    assert.deepEqual(sql, expectedSql);
  }.bind(this));
};

p.testGetCustomColumnDeclarationSql = function() {
  var field = {columnDefinition: 'MEDIUMINT(6) UNSIGNED'};

  it('should be the same SQL declaration', function() {
    assert.equal(this._platform.getColumnDeclarationSQL('foo', field), 'foo MEDIUMINT(6) UNSIGNED');
  }.bind(this));
};

p.testGetCreateTableSqlDispatchEvent = function() {
  it.skip('should implement after adding event manager');
};

p.testGetDropTableSqlDispatchEvent = function() {
  it.skip('should implement after adding event manager');
};

p.testGetAlterTableSqlDispatchEvent = function() {
  it.skip('should implement after adding event manager');
};

p.testCreateTableColumnComments = function() {
  var table = new Table('test');

  table.addColumn('id', this.getType('integer'), {comment: 'This is a comment'});
  table.setPrimaryKey(['id']);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(this._platform.getCreateTableSQL(table), this.getCreateTableColumnCommentsSQL());
  }.bind(this));
};

p.testAlterTableColumnComments = function() {
  var tableDiff = new TableDiff('mytable');

  tableDiff.addedColumns['quota'] = new Column('quota', this.getType('integer'), {comment: 'A comment'});

  tableDiff.changedColumns['foo'] = new ColumnDiff(
    'foo',
    new Column(
      'foo',
      this.getType('string')
    ),
    ['comment']
  );

  tableDiff.changedColumns['bar'] = new ColumnDiff(
    'bar',
    new Column(
      'baz',
      this.getType('string'),
      {comment: 'B comment'}
    ),
    ['comment']
  );

  it('should be the same SQL declaration', function() {
    assert.deepEqual(this._platform.getAlterTableSQL(tableDiff), this.getAlterTableColumnCommentsSQL());
  }.bind(this));
};

p.testCreateTableColumnTypeComments = function() {
  var table = new Table('test');

  table.addColumn('id', this.getType('integer'));
  table.addColumn('data', this.getType('array'));

  table.setPrimaryKey(['id']);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(this._platform.getCreateTableSQL(table), this.getCreateTableColumnTypeCommentsSQL());
  }.bind(this));
};

p.getCreateTableColumnCommentsSQL = function() {
  it.skip('Platform does not support Column comments.');
};

p.getAlterTableColumnCommentsSQL =function() {
  it.skip('Platform does not support Column comments.');
};

p.getCreateTableColumnTypeCommentsSQL = function() {
  it.skip('Platform does not support Column comments.');
};

p.testGetDefaultValueDeclarationSQL = function() {
  // non-timestamp value will get single quotes
  var field = {
    "type": this.getType('string'),
    "default": 'non_timestamp'
  };

  it('should be the same SQL declaration', function() {
    assert.equal(this._platform.getDefaultValueDeclarationSQL(field), " DEFAULT 'non_timestamp'");
  }.bind(this));
};

p.testGetDefaultValueDeclarationSQLDateTime = function() {
  ['datetime', 'datetimetz'].forEach(function(type) {
    var field = {
      "type": this.getType(type),
      "default": this._platform.getCurrentTimestampSQL()
    };

    it('should be the same SQL DEFAULT declaration', function() {
      assert.equal(
        this._platform.getDefaultValueDeclarationSQL(field),
        ' DEFAULT ' + this._platform.getCurrentTimestampSQL()
      );
    }.bind(this));
  }.bind(this));
};

p.testGetDefaultValueDeclarationSQLForIntegerTypes = function() {
  ['bigint', 'integer', 'smallint'].forEach(function(type) {
    var field = {
      "type": this.getType(type),
      "default": 1
    };

    it('should be the same SQL DEFAULT declaration', function() {
      assert.equal(
        this._platform.getDefaultValueDeclarationSQL(field),
        ' DEFAULT 1'
      );
    }.bind(this));
  }.bind(this));
};

p.testKeywordList = function() {
  var keywordList = this._platform.getReservedKeywordsList();

  it('should be the instance of "AbstractKeywords"', function() {
    assert.instanceOf(keywordList, AbstractKeywords);
  });

  it('should be true for the matched keyword', function() {
    assert.isTrue(keywordList.isKeyword('table'));
  });
};

p.testQuotedColumnInPrimaryKeyPropagation = function() {
  var table = new Table('`quoted`');

  table.addColumn('create', this.getType('string'));
  table.setPrimaryKey(['create']);

  it('should be the same SQL declaration', function() {
    var sql = this._platform.getCreateTableSQL(table);

    assert.deepEqual(sql, this.getQuotedColumnInPrimaryKeySQL());
  }.bind(this));
};

p.getQuotedColumnInPrimaryKeySQL = function() {
  throw new MethodNotImplementException('getQuotedColumnInPrimaryKeySQL');
};
p.getQuotedColumnInIndexSQL = function() {
  throw new MethodNotImplementException('getQuotedColumnInIndexSQL');
};
p.getQuotedNameInIndexSQL = function() {
  throw new MethodNotImplementException('getQuotedNameInIndexSQL');
};
p.getQuotedColumnInForeignKeySQL = function() {
  throw new MethodNotImplementException('getQuotedColumnInForeignKeySQL');
};

p.testQuotedColumnInIndexPropagation = function() {
  var table = new Table('`quoted`');

  table.addColumn('create', this.getType('string'));
  table.addIndex(['create']);

  it('should be the same SQL declaration', function() {
    var sql = this._platform.getCreateTableSQL(table);

    assert.deepEqual(sql, this.getQuotedColumnInIndexSQL());
  }.bind(this));
};

p.testQuotedNameInIndexSQL = function() {
  var table = new Table('test');

  table.addColumn('column1', this.getType('string'));
  table.addIndex(['column1'], '`key`');

  it('should be the same SQL declaration', function() {
    var sql = this._platform.getCreateTableSQL(table);

    assert.deepEqual(sql, this.getQuotedNameInIndexSQL());
  }.bind(this));
};

p.testQuotedColumnInForeignKeyPropagation = function() {
  var table = new Table('`quoted`');

  table.addColumn('create', this.getType('string'));
  table.addColumn('foo', this.getType('string'));
  table.addColumn('`bar`', this.getType('string'));

  // Foreign table with reserved keyword as name (needs quotation).
  var foreignTable = new Table('foreign');

  foreignTable.addColumn('create', this.getType('string'));    // Foreign column with reserved keyword as name (needs quotation).
  foreignTable.addColumn('bar', this.getType('string'));       // Foreign column with non-reserved keyword as name (does not need quotation).
  foreignTable.addColumn('`foo-bar`', this.getType('string')); // Foreign table with special character in name (needs quotation on some platforms, e.g. Sqlite).

  table.addForeignKeyConstraint(
    foreignTable,
    ['create', 'foo', '`bar`'],
    ['create', 'bar', '`foo-bar`'],
    {},
    'FK_WITH_RESERVED_KEYWORD'
  );

  // Foreign table with non-reserved keyword as name (does not need quotation).
  foreignTable = new Table('foo');

  foreignTable.addColumn('create', this.getType('string'));    // Foreign column with reserved keyword as name (needs quotation).
  foreignTable.addColumn('bar', this.getType('string'));       // Foreign column with non-reserved keyword as name (does not need quotation).
  foreignTable.addColumn('`foo-bar`', this.getType('string')); // Foreign table with special character in name (needs quotation on some platforms, e.g. Sqlite).

  table.addForeignKeyConstraint(
    foreignTable,
    ['create', 'foo', '`bar`'],
    ['create', 'bar', '`foo-bar`'],
    {},
    'FK_WITH_NON_RESERVED_KEYWORD'
  );

  // Foreign table with special character in name (needs quotation on some platforms, e.g. Sqlite).
  foreignTable = new Table('`foo-bar`');

  foreignTable.addColumn('create', this.getType('string'));    // Foreign column with reserved keyword as name (needs quotation).
  foreignTable.addColumn('bar', this.getType('string'));       // Foreign column with non-reserved keyword as name (does not need quotation).
  foreignTable.addColumn('`foo-bar`', this.getType('string')); // Foreign table with special character in name (needs quotation on some platforms, e.g. Sqlite).

  table.addForeignKeyConstraint(
    foreignTable,
    ['create', 'foo', '`bar`'],
    ['create', 'bar', '`foo-bar`'],
    {},
    'FK_WITH_INTENDED_QUOTATION'
  );

  var sql = this._platform.getCreateTableSQL(table, AbstractPlatform.CREATE_FOREIGNKEYS);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(sql, this.getQuotedColumnInForeignKeySQL());
  }.bind(this));
};

p.testQuotesReservedKeywordInUniqueConstraintDeclarationSQL = function() {
  var index = new Index('select', ['foo'], true);

  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getUniqueConstraintDeclarationSQL('select', index),
      this.getQuotesReservedKeywordInUniqueConstraintDeclarationSQL()
    );
  }.bind(this));
};

p.getQuotesReservedKeywordInUniqueConstraintDeclarationSQL = function() {
  throw new MethodNotImplementException('getQuotesReservedKeywordInUniqueConstraintDeclarationSQL');
};

p.testQuotesReservedKeywordInIndexDeclarationSQL = function() {
  var index = new Index('select', ['foo']);

  if (!this.supportsInlineIndexDeclaration()) {
    it('should throw "DBALException" exception', function() {
      assert.throws(function() {
        this._platform.getIndexDeclarationSQL('select', index);
      }.bind(this), DBALException);
    }.bind(this));

    return;
  }

  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getIndexDeclarationSQL('select', index),
      this.getQuotesReservedKeywordInIndexDeclarationSQL()
    );
  }.bind(this));
};

p.getQuotesReservedKeywordInIndexDeclarationSQL = function() {
  throw new MethodNotImplementException('getQuotesReservedKeywordInIndexDeclarationSQL');
};

/**
 * @return boolean
 */
p.supportsInlineIndexDeclaration = function() {
  return true;
};

p.testGetCreateSchemaSQL = function() {
  it('should throw "DABLException" exception', function() {
    assert.throws(function () {
      this._platform.getCreateSchemaSQL('schema');
    }.bind(this), DBALException);
  }.bind(this));
};

p.testAlterTableChangeQuotedColumn = function() {
  var tableDiff = new TableDiff('mytable');

  tableDiff.fromTable = new Table('mytable');

  tableDiff.changedColumns['foo'] = new ColumnDiff(
    'select',
    new Column(
      'select',
      this.getType('string')
    ),
    ['type']
  );

  it('should include partial SQL declaration', function() {
    assert.include(
      this._platform.getAlterTableSQL(tableDiff).join(';'),
      this._platform.quoteIdentifier('select')
    );
  }.bind(this));
};

p.testUsesSequenceEmulatedIdentityColumns = function() {
  it('should be false', function() {
    assert.isFalse(this._platform.usesSequenceEmulatedIdentityColumns());
  }.bind(this));
};

p.testReturnsIdentitySequenceName = function() {
  it('should throw "DBALException" exception', function() {
    assert.throws(function () {
      this._platform.getIdentitySequenceName('mytable', 'mycolumn');
    }.bind(this), DBALException);
  }.bind(this));
};

p.testReturnsBinaryMaxLength = function() {
  it('should be the same length', function() {
    assert.equal(this._platform.getBinaryMaxLength(), this.getBinaryMaxLength());
  }.bind(this));
};

p.getBinaryMaxLength = function() {
  return 4000;
};

p.hasNativeJsonType = function() {
  it('should be false', function() {
    assert.isFalse(this._platform.hasNativeJsonType());
  }.bind(this));
};

p.testAlterTableRenameIndex = function() {
  var tableDiff = new TableDiff('mytable');

  tableDiff.fromTable = new Table('mytable');
  tableDiff.fromTable.addColumn('id', this.getType('integer'));
  tableDiff.fromTable.setPrimaryKey(['id']);
  tableDiff.renamedIndexes = {
    "idx_foo": new Index('idx_bar', ['id'])
  };

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getAlterTableRenameIndexSQL()
    );
  }.bind(this));
};

p.getAlterTableRenameIndexSQL = function() {
  return [
    'DROP INDEX idx_foo',
    'CREATE INDEX idx_bar ON mytable (id)'
  ];
};

p.testQuotesAlterTableRenameIndex = function() {
  var tableDiff = new TableDiff('table');

  tableDiff.fromTable = new Table('table');
  tableDiff.fromTable.addColumn('id', this.getType('integer'));
  tableDiff.fromTable.setPrimaryKey(['id']);
  tableDiff.renamedIndexes = {
    "create": new Index('select', ['id']),
    "`foo`": new Index('`bar`',  ['id'])
  };

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getQuotedAlterTableRenameIndexSQL()
    );
  }.bind(this));
};

p.getQuotedAlterTableRenameIndexSQL = function() {
  return [
    'DROP INDEX "create"',
    'CREATE INDEX "select" ON "table" (id)',
    'DROP INDEX "foo"',
    'CREATE INDEX "bar" ON "table" (id)'
  ];
};

p.testQuotesAlterTableRenameColumn = function() {
  var fromTable = new Table('mytable');

  fromTable.addColumn('unquoted1', this.getType('integer'), {"comment": 'Unquoted 1'});
  fromTable.addColumn('unquoted2', this.getType('integer'), {"comment": 'Unquoted 2'});
  fromTable.addColumn('unquoted3', this.getType('integer'), {"comment": 'Unquoted 3'});

  fromTable.addColumn('create', this.getType('integer'), {"comment": 'Reserved keyword 1'});
  fromTable.addColumn('table', this.getType('integer'), {"comment": 'Reserved keyword 2'});
  fromTable.addColumn('select', this.getType('integer'), {"comment": 'Reserved keyword 3'});

  fromTable.addColumn('`quoted1`', this.getType('integer'), {"comment": 'Quoted 1'});
  fromTable.addColumn('`quoted2`', this.getType('integer'), {"comment": 'Quoted 2'});
  fromTable.addColumn('`quoted3`', this.getType('integer'), {"comment": 'Quoted 3'});

  var toTable = new Table('mytable');

  toTable.addColumn('unquoted', this.getType('integer'), {"comment": 'Unquoted 1'});  // unquoted . unquoted
  toTable.addColumn('where', this.getType('integer'), {"comment": 'Unquoted 2'});     // unquoted . reserved keyword
  toTable.addColumn('`foo`', this.getType('integer'), {"comment": 'Unquoted 3'});     // unquoted . quoted

  toTable.addColumn('reserved_keyword', this.getType('integer'), {"comment": 'Reserved keyword 1'});  // reserved keyword . unquoted
  toTable.addColumn('from', this.getType('integer'), {"comment": 'Reserved keyword 2'});              // reserved keyword . reserved keyword
  toTable.addColumn('`bar`', this.getType('integer'), {"comment": 'Reserved keyword 3'});             // reserved keyword . quoted

  toTable.addColumn('quoted', this.getType('integer'), {"comment": 'Quoted 1'});  // quoted . unquoted
  toTable.addColumn('and', this.getType('integer'), {"comment": 'Quoted 2'});     // quoted . reserved keyword
  toTable.addColumn('`baz`', this.getType('integer'), {"comment": 'Quoted 3'});   // quoted . quoted

  var comparator = new Comparator();

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(comparator.diffTable(fromTable, toTable)),
      this.getQuotedAlterTableRenameColumnSQL()
    );
  }.bind(this));
};

/**
* Returns SQL statements for {@link testQuotesAlterTableRenameColumn}.
*
* @returns {Array<string>}
*/
p.getQuotedAlterTableRenameColumnSQL = function() {
  throw new MethodNotImplementException('getQuotedAlterTableRenameColumnSQL');
};

p.testQuotesAlterTableChangeColumnLength = function() {
  var fromTable = new Table('mytable');

  fromTable.addColumn('unquoted1', this.getType('string'), {"comment": 'Unquoted 1', "length": 10});
  fromTable.addColumn('unquoted2', this.getType('string'), {"comment": 'Unquoted 2', "length": 10});
  fromTable.addColumn('unquoted3', this.getType('string'), {"comment": 'Unquoted 3', "length": 10});

  fromTable.addColumn('create', this.getType('string'), {"comment": 'Reserved keyword 1', "length": 10});
  fromTable.addColumn('table', this.getType('string'), {"comment": 'Reserved keyword 2', "length": 10});
  fromTable.addColumn('select', this.getType('string'), {"comment": 'Reserved keyword 3', "length": 10});

  var toTable = new Table('mytable');

  toTable.addColumn('unquoted1', this.getType('string'), {"comment": 'Unquoted 1', "length": 255});
  toTable.addColumn('unquoted2', this.getType('string'), {"comment": 'Unquoted 2', "length": 255});
  toTable.addColumn('unquoted3', this.getType('string'), {"comment": 'Unquoted 3', "length": 255});

  toTable.addColumn('create', this.getType('string'), {"comment": 'Reserved keyword 1', "length": 255});
  toTable.addColumn('table', this.getType('string'), {"comment": 'Reserved keyword 2', "length": 255});
  toTable.addColumn('select', this.getType('string'), {"comment": 'Reserved keyword 3', "length": 255});

  var comparator = new Comparator();

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(comparator.diffTable(fromTable, toTable)),
      this.getQuotedAlterTableChangeColumnLengthSQL()
    );
  }.bind(this));
};

/**
* Returns SQL statements for {@link testQuotesAlterTableChangeColumnLength}.
*
* @return {Array<string>}
*/
p.getQuotedAlterTableChangeColumnLengthSQL = function() {
  throw new MethodNotImplementException('getQuotedAlterTableChangeColumnLengthSQL');
};

p.testAlterTableRenameIndexInSchema = function() {
  var tableDiff = new TableDiff('myschema.mytable');

  tableDiff.fromTable = new Table('myschema.mytable');
  tableDiff.fromTable.addColumn('id', this.getType('integer'));
  tableDiff.fromTable.setPrimaryKey(['id']);
  tableDiff.renamedIndexes = {
    "idx_foo": new Index('idx_bar', ['id'])
  };

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getAlterTableRenameIndexInSchemaSQL()
    );
  }.bind(this));
};

p.getAlterTableRenameIndexInSchemaSQL = function() {
  return [
    'DROP INDEX idx_foo',
    'CREATE INDEX idx_bar ON myschema.mytable (id)'
  ];
};

p.testQuotesAlterTableRenameIndexInSchema = function() {
  var tableDiff = new TableDiff('`schema`.table');

  tableDiff.fromTable = new Table('`schema`.table');
  tableDiff.fromTable.addColumn('id', this.getType('integer'));
  tableDiff.fromTable.setPrimaryKey(['id']);
  tableDiff.renamedIndexes = {
    "create": new Index('select', ['id']),
    "`foo`": new Index('`bar`', ['id'])
  };

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getQuotedAlterTableRenameIndexInSchemaSQL()
    );
  }.bind(this));
};

p.getQuotedAlterTableRenameIndexInSchemaSQL = function() {
  return [
    'DROP INDEX "schema"."create"',
    'CREATE INDEX "select" ON "schema"."table" (id)',
    'DROP INDEX "schema"."foo"',
    'CREATE INDEX "bar" ON "schema"."table" (id)'
  ];
};

p.getStringLiteralQuoteCharacter = function() {
  return "'";
};

p.testGetStringLiteralQuoteCharacter = function() {
  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getStringLiteralQuoteCharacter(),
      this.getStringLiteralQuoteCharacter()
    );
  }.bind(this));
};

p.getQuotedCommentOnColumnSQLWithoutQuoteCharacter = function() {
  return "COMMENT ON COLUMN mytable.id IS 'This is a comment'";
};

p.testGetCommentOnColumnSQLWithoutQuoteCharacter = function() {
  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getCommentOnColumnSQL('mytable', 'id', 'This is a comment'),
      this.getQuotedCommentOnColumnSQLWithoutQuoteCharacter()
    );
  }.bind(this));
};

p.getQuotedCommentOnColumnSQLWithQuoteCharacter = function() {
  return "COMMENT ON COLUMN mytable.id IS 'It''s a quote !'";
};

p.testGetCommentOnColumnSQLWithQuoteCharacter = function() {
  var c = this.getStringLiteralQuoteCharacter();

  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getCommentOnColumnSQL('mytable', 'id', "It" + c + "s a quote !"),
      this.getQuotedCommentOnColumnSQLWithQuoteCharacter()
    );
  }.bind(this));
};

/**
 * @return array
 *
 * @see testGetCommentOnColumnSQL
 */
p.getCommentOnColumnSQL = function() {
  throw new MethodNotImplementException('getCommentOnColumnSQL');
};

p.testGetCommentOnColumnSQL = function() {
  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      [
        this._platform.getCommentOnColumnSQL('foo', 'bar', 'comment'),      // regular identifiers
        this._platform.getCommentOnColumnSQL('`Foo`', '`BAR`', 'comment'),  // explicitly quoted identifiers
        this._platform.getCommentOnColumnSQL('select', 'from', 'comment')   // reserved keyword identifiers
      ],
      this.getCommentOnColumnSQL()
    );
  }.bind(this));
};

p.getQuotedStringLiteralWithoutQuoteCharacter = function() {
  return "'No quote'";
};

p.getQuotedStringLiteralWithQuoteCharacter = function() {
  return "'It''s a quote'";
};

p.getQuotedStringLiteralQuoteCharacter = function() {
  return "''''";
};

p.testQuoteStringLiteral = function() {
  var c = this.getStringLiteralQuoteCharacter();

  it('should be the same quote string', function() {
    assert.equal(
      this._platform.quoteStringLiteral('No quote'),
      this.getQuotedStringLiteralWithoutQuoteCharacter()
    );

    assert.equal(
      this._platform.quoteStringLiteral('It' + c + 's a quote'),
      this.getQuotedStringLiteralWithQuoteCharacter()
    );

    assert.equal(
      this._platform.quoteStringLiteral(c),
      this.getQuotedStringLiteralQuoteCharacter()
    );
  }.bind(this));
};

p.testGeneratesAlterTableRenameColumnSQL = function() {
  var table = new Table('foo');
    
  table.addColumn(
    'bar',
    this.getType('integer'),
    {"notnull": true, "default": 666, "comment": 'rename test'}
  );

  var tableDiff = new TableDiff('foo');

  tableDiff.fromTable = table;
  tableDiff.renamedColumns['bar'] = new Column(
    'baz',
    this.getType('integer'),
    {"notnull": true, "default": 666, "comment": 'rename test'}
  );

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getAlterTableRenameColumnSQL()
    );
  }.bind(this));
};

p.getAlterTableRenameColumnSQL = function() {
  throw new MethodNotImplementException('getAlterTableRenameColumnSQL');
};

p.testQuotesTableIdentifiersInAlterTableSQL = function() {
  var table = new Table('"foo"');

  table.addColumn('id',  this.getType('integer'));
  table.addColumn('fk',  this.getType('integer'));
  table.addColumn('fk2', this.getType('integer'));
  table.addColumn('fk3', this.getType('integer'));
  table.addColumn('bar', this.getType('integer'));
  table.addColumn('baz', this.getType('integer'));
  table.addForeignKeyConstraint('fk_table', ['fk'],  ['id'], {}, 'fk1');
  table.addForeignKeyConstraint('fk_table', ['fk2'], ['id'], {}, 'fk2');

  var tableDiff = new TableDiff('"foo"');

  tableDiff.fromTable = table;
  tableDiff.newName = 'table';
  tableDiff.addedColumns['bloo'] = new Column('bloo', this.getType('integer'));
  tableDiff.changedColumns['bar'] = new ColumnDiff(
    'bar',
    new Column('bar', this.getType('integer'), {"notnull": false}),
    ['notnull'],
    table.getColumn('bar')
  );
  tableDiff.renamedColumns['id'] = new Column('war', this.getType('integer'));
  tableDiff.removedColumns['baz'] = new Column('baz', this.getType('integer'));
  tableDiff.addedForeignKeys.push(  new ForeignKeyConstraint(['fk3'], 'fk_table',  ['id'], 'fk_add'));
  tableDiff.changedForeignKeys.push(new ForeignKeyConstraint(['fk2'], 'fk_table2', ['id'], 'fk2'));
  tableDiff.removedForeignKeys.push(new ForeignKeyConstraint(['fk'],  'fk_table',  ['id'], 'fk1'));

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getQuotesTableIdentifiersInAlterTableSQL()
    );
  }.bind(this));
};

p.getQuotesTableIdentifiersInAlterTableSQL = function() {
  throw new MethodNotImplementException('getQuotesTableIdentifiersInAlterTableSQL');
};

p.testAlterStringToFixedString = function() {
  var table = new Table('mytable');

  table.addColumn('name', this.getType('string'), {"length": 2});

  var tableDiff = new TableDiff('mytable');

  tableDiff.fromTable = table;

  tableDiff.changedColumns['name'] = new ColumnDiff(
    'name',
    new Column(
      'name',
      this.getType('string'),
      {"fixed": true, "length": 2}
    ),
    ['fixed']
  );

  var sql = this._platform.getAlterTableSQL(tableDiff);
  var expectedSql = this.getAlterStringToFixedStringSQL();

  it('should be the same SQL declaration', function() {
    assert.deepEqual(sql, expectedSql);
  }.bind(this));
};

p.getAlterStringToFixedStringSQL = function() {
  throw new MethodNotImplementException('getAlterStringToFixedStringSQL');
};

p.testGeneratesAlterTableRenameIndexUsedByForeignKeySQL = function() {
  var foreignTable = new Table('foreign_table');
  
  foreignTable.addColumn('id', this.getType('integer'));
  foreignTable.setPrimaryKey(['id']);

  var primaryTable = new Table('mytable');
  
  primaryTable.addColumn('foo', this.getType('integer'));
  primaryTable.addColumn('bar', this.getType('integer'));
  primaryTable.addColumn('baz', this.getType('integer'));
  primaryTable.addIndex(['foo'], 'idx_foo');
  primaryTable.addIndex(['bar'], 'idx_bar');
  primaryTable.addForeignKeyConstraint(foreignTable, ['foo'], ['id'], {}, 'fk_foo');
  primaryTable.addForeignKeyConstraint(foreignTable, ['bar'], ['id'], {}, 'fk_bar');

  var tableDiff = new TableDiff('mytable');

  tableDiff.fromTable = primaryTable;
  tableDiff.renamedIndexes['idx_foo'] = new Index('idx_foo_renamed', ['foo']);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      this.getGeneratesAlterTableRenameIndexUsedByForeignKeySQL()
    );
  }.bind(this));
};

p.getGeneratesAlterTableRenameIndexUsedByForeignKeySQL = function() {
  throw new MethodNotImplementException('getGeneratesAlterTableRenameIndexUsedByForeignKeySQL');
};
