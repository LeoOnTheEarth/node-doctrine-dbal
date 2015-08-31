module.exports = AbstractMySQLPlatformTestCase;

var assert = require('chai').assert;
var Connection = require('../../lib/Connection.js');
var Table = require('../../lib/Schema/Table.js');
var TableDiff = require('../../lib/Schema/TableDiff.js');
var Index = require('../../lib/Schema/Index.js');
var Comparator = require('../../lib/Schema/Comparator.js');
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var AbstractPlatform = require('../../lib/Platforms/AbstractPlatform.js');
var AbstractPlatformTestCase = require('./AbstractPlatformTestCase.js');
var TypeFactory = require('../../lib/Types/MySQL/TypeFactory.js');
var inherits = require('util').inherits;
var validArg = require('../../lib/util.js').validArg;
var clone = require('clone');

/**
 * Class AbstractMySQLPlatformTestCase
 *
 * @constructor
 */
function AbstractMySQLPlatformTestCase()
{
  AbstractMySQLPlatformTestCase.super_.call(this);
}

inherits(AbstractMySQLPlatformTestCase, AbstractPlatformTestCase);

var p = AbstractMySQLPlatformTestCase.prototype;

p.getType = function(type) {
  validArg(type, 'type', 'String');

  switch (type) {
    case 'bigint': return TypeFactory.getType(TypeFactory.BIGINT);
    case 'integer': return TypeFactory.getType(TypeFactory.INT);
    case 'smallint': return TypeFactory.getType(TypeFactory.SMALLINT);
    case 'string': return TypeFactory.getType(TypeFactory.VARCHAR);
    case 'boolean': return TypeFactory.getType(TypeFactory.TINYINT);
    case 'datetime':
    case 'datetimetz':
      return TypeFactory.getType(TypeFactory.DATETIME);
    case 'text': return TypeFactory.getType(TypeFactory.LONGTEXT);
    case 'blob': return TypeFactory.getType(TypeFactory.LONGBLOB);
    case 'array': return TypeFactory.getType(TypeFactory.LONGTEXT);
  }

  throw new Error('type "' + type + '" is not defined!');
};

p.testModifyLimitQueryWitoutLimit = function() {
  var sql = this._platform.modifyLimitQuery('SELECT n FROM Foo', null , 10);

  it('should be the same SQL declaration', function() {
    assert.equal(sql, 'SELECT n FROM Foo LIMIT 18446744073709551615 OFFSET 10');
  });
};

p.testGenerateMixedCaseTableCreate = function() {
  var table = new Table('Foo');

  table.addColumn('Bar', this.getType('integer'));

  var sql = this._platform.getCreateTableSQL(table);

  it('should be the same SQL declaration', function() {
    assert.equal(
      sql.shift(),
      'CREATE TABLE Foo (Bar INT NOT NULL) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB'
    );
  });
};

p.getGenerateTableSql = function() {
  return 'CREATE TABLE test (id INT AUTO_INCREMENT NOT NULL, test VARCHAR(255) DEFAULT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB';
};

p.getGenerateTableWithMultiColumnUniqueIndexSql = function() {
  return [
    'CREATE TABLE test (foo VARCHAR(255) DEFAULT NULL, bar VARCHAR(255) DEFAULT NULL, UNIQUE INDEX UNIQ_D87F7E0C8C73652176FF8CAA (foo, bar)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB'
  ];
};

p.getGenerateAlterTableSql = function() {
  return [
    "ALTER TABLE mytable RENAME TO userlist, ADD quota INT DEFAULT NULL, DROP foo, CHANGE bar baz VARCHAR(255) DEFAULT 'def' NOT NULL, CHANGE bloo bloo TINYINT(1) DEFAULT '0' NOT NULL"
  ];
};

p.testGeneratesSqlSnippets = function() {
  it('should be the same SQL declaration', function() {
    assert.equal(this._platform.getRegexpExpression(), 'RLIKE', 'Regular expression operator is not correct');
    assert.equal(this._platform.getIdentifierQuoteCharacter(), '`', 'Quote character is not correct');
    assert.equal(this._platform.getConcatExpression('column1', 'column2', 'column3'), 'CONCAT(column1, column2, column3)', 'Concatenation function is not correct');
  }.bind(this));
};

p.testGeneratesTransactionsCommands = function() {
  it('should be the same SQL declaration', function() {
    assert.equal(
      this._platform.getSetTransactionIsolationSQL(Connection.TRANSACTION_READ_UNCOMMITTED),
      'SET SESSION TRANSACTION ISOLATION LEVEL READ UNCOMMITTED'
    );

    assert.equal(
      this._platform.getSetTransactionIsolationSQL(Connection.TRANSACTION_READ_COMMITTED),
      'SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED'
    );

    assert.equal(
      this._platform.getSetTransactionIsolationSQL(Connection.TRANSACTION_REPEATABLE_READ),
      'SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ'
    );

    assert.equal(
      this._platform.getSetTransactionIsolationSQL(Connection.TRANSACTION_SERIALIZABLE),
      'SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE'
    );
  }.bind(this));
};

p.testGeneratesDDLSnippets = function() {
  it('should be the same SQL declaration', function() {
    assert.equal(this._platform.getListDatabasesSQL(), 'SHOW DATABASES');
    assert.equal(this._platform.getCreateDatabaseSQL('foobar'), 'CREATE DATABASE foobar');
    assert.equal(this._platform.getDropDatabaseSQL('foobar'), 'DROP DATABASE foobar');
    assert.equal(this._platform.getDropTableSQL('foobar'), 'DROP TABLE foobar');
  }.bind(this));
};

p.testPrefersIdentityColumns = function() {
  it('should be true', function() {
    assert.isTrue(this._platform.prefersIdentityColumns());
  }.bind(this));
};

p.testSupportsIdentityColumns = function() {
  it('should be true', function() {
    assert.isTrue(this._platform.supportsIdentityColumns());
  }.bind(this));
};

p.testDoesSupportSavePoints = function() {
  it('should be true', function() {
    assert.isTrue(this._platform.supportsSavepoints());
  }.bind(this));
};

p.getGenerateIndexSql = function() {
  return 'CREATE INDEX my_idx ON mytable (user_name, last_login)';
};

p.getGenerateUniqueIndexSql = function() {
  return 'CREATE UNIQUE INDEX index_name ON test (test, test2)';
};

p.getGenerateForeignKeySql = function() {
  return 'ALTER TABLE test ADD FOREIGN KEY (fk_name_id) REFERENCES other_table (id)';
};

p.testUniquePrimaryKey = function() {
  var keyTable = new Table('foo');
  
  keyTable.addColumn('bar', this.getType('integer'));
  keyTable.addColumn('baz', this.getType('string'));
  keyTable.setPrimaryKey(['bar']);
  keyTable.addUniqueIndex(['baz']);

  var oldTable = new Table('foo');

  oldTable.addColumn('bar', this.getType('integer'));
  oldTable.addColumn('baz', this.getType('string'));

  var c = new Comparator();

  var diff = c.diffTable(oldTable, keyTable);

  var sql = this._platform.getAlterTableSQL(diff);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      sql,
      [
        "ALTER TABLE foo ADD PRIMARY KEY (bar)",
        "CREATE UNIQUE INDEX UNIQ_8C73652178240498 ON foo (baz)"
      ]
    );
  }.bind(this));
};

p.testModifyLimitQuery = function() {
  var sql = this._platform.modifyLimitQuery('SELECT * FROM user', 10, 0);

  it('should be the same SQL declaration', function() {
    assert.equal(sql, 'SELECT * FROM user LIMIT 10 OFFSET 0');
  });
};

p.testModifyLimitQueryWithEmptyOffset = function() {
  var sql = this._platform.modifyLimitQuery('SELECT * FROM user', 10);

  it('should be the same SQL declaration', function() {
    assert.equal(sql, 'SELECT * FROM user LIMIT 10');
  });
};

p.getCreateTableColumnCommentsSQL = function() {
  return ["CREATE TABLE test (id INT NOT NULL COMMENT 'This is a comment', PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB"];
};

p.getAlterTableColumnCommentsSQL = function() {
  return ["ALTER TABLE mytable ADD quota INT NOT NULL COMMENT 'A comment', CHANGE foo foo VARCHAR(255) NOT NULL, CHANGE bar baz VARCHAR(255) NOT NULL COMMENT 'B comment'"];
};

p.getCreateTableColumnTypeCommentsSQL = function() {
  return ["CREATE TABLE test (id INT NOT NULL, data LONGTEXT NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB"];
};

p.testChangeIndexWithForeignKeys = function() {
  var index = new Index('idx', ['col'], false);
  var unique = new Index('uniq', ['col'], true);

  it('should be the same SQL declaration', function() {
    var diff = new TableDiff('test', {}, {}, {}, {0:unique}, {}, {0:index});
    var sql = this._platform.getAlterTableSQL(diff);
    assert.deepEqual(sql, ['ALTER TABLE test DROP INDEX idx, ADD UNIQUE INDEX uniq (col)']);
  }.bind(this));

  it('should be the same SQL declaration', function() {
    var diff = new TableDiff('test', {}, {}, {}, {0:index}, {}, {0:unique});
    var sql = this._platform.getAlterTableSQL(diff);
    assert.deepEqual(sql, ['ALTER TABLE test DROP INDEX uniq, ADD INDEX idx (col)']);
  }.bind(this));
};

p.getQuotedColumnInPrimaryKeySQL = function() {
  return [
    'CREATE TABLE `quoted` (`create` VARCHAR(255) NOT NULL, PRIMARY KEY(`create`)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB'
  ];
};

p.getQuotedColumnInIndexSQL = function() {
  return [
    'CREATE TABLE `quoted` (`create` VARCHAR(255) NOT NULL, INDEX IDX_22660D028FD6E0FB (`create`)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB'
  ];
};

p.getQuotedNameInIndexSQL = function() {
  return [
    'CREATE TABLE test (column1 VARCHAR(255) NOT NULL, INDEX `key` (column1)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB'
  ];
};

p.getQuotedColumnInForeignKeySQL = function() {
  return [
    'CREATE TABLE `quoted` (`create` VARCHAR(255) NOT NULL, foo VARCHAR(255) NOT NULL, `bar` VARCHAR(255) NOT NULL) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB',
    'ALTER TABLE `quoted` ADD CONSTRAINT FK_WITH_RESERVED_KEYWORD FOREIGN KEY (`create`, foo, `bar`) REFERENCES `foreign` (`create`, bar, `foo-bar`)',
    'ALTER TABLE `quoted` ADD CONSTRAINT FK_WITH_NON_RESERVED_KEYWORD FOREIGN KEY (`create`, foo, `bar`) REFERENCES foo (`create`, bar, `foo-bar`)',
    'ALTER TABLE `quoted` ADD CONSTRAINT FK_WITH_INTENDED_QUOTATION FOREIGN KEY (`create`, foo, `bar`) REFERENCES `foo-bar` (`create`, bar, `foo-bar`)'
  ];
};

p.testCreateTableWithFulltextIndex = function() {
  var table = new Table('fulltext_table');

  table.addOption('engine', 'MyISAM');
  table.addColumn('text', this.getType('text'));
  table.addIndex(['text'], 'fulltext_text');

  var index = table.getIndex('fulltext_text');

  index.addFlag('fulltext');

  it('should be the same SQL declaration', function() {
    var sql = this._platform.getCreateTableSQL(table);

    assert.deepEqual(
      sql,
      ['CREATE TABLE fulltext_table (text LONGTEXT NOT NULL, FULLTEXT INDEX fulltext_text (text)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = MyISAM']
    );
  }.bind(this));
};

p.testCreateTableWithSpatialIndex = function() {
  var table = new Table('spatial_table');

  table.addOption('engine', 'MyISAM');
  table.addColumn('point', this.getType('text')); // This should be a point type
  table.addIndex(['point'], 'spatial_text');

  var index = table.getIndex('spatial_text');

  index.addFlag('spatial');

  var sql = this._platform.getCreateTableSQL(table);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      sql,
      ['CREATE TABLE spatial_table (point LONGTEXT NOT NULL, SPATIAL INDEX spatial_text (point)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = MyISAM']
    );
  });
};

p.testAlterTableAddPrimaryKey = function() {
  var table = new Table('alter_table_add_pk');

  table.addColumn('id', this.getType('integer'));
  table.addColumn('foo', this.getType('integer'));
  table.addIndex(['id'], 'idx_id');

  var comparator = new Comparator();
  var diffTable  = new Table('alter_table_add_pk');

  diffTable.addColumn('id', this.getType('integer'));
  diffTable.addColumn('foo', this.getType('integer'));
  diffTable.addIndex(['id'], 'idx_id');
  diffTable.dropIndex('idx_id');
  diffTable.setPrimaryKey(['id']);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(comparator.diffTable(table, diffTable)),
      ['DROP INDEX idx_id ON alter_table_add_pk', 'ALTER TABLE alter_table_add_pk ADD PRIMARY KEY (id)']
    );
  }.bind(this));
};

p.testAlterPrimaryKeyWithAutoincrementColumn = function() {
  var table = new Table("alter_primary_key");

  table.addColumn('id', this.getType('integer'), {"autoincrement": true});
  table.addColumn('foo', this.getType('integer'));
  table.setPrimaryKey(['id']);

  var comparator = new Comparator();
  var diffTable = new Table("alter_primary_key");

  diffTable.addColumn('id', this.getType('integer'), {"autoincrement": true});
  diffTable.addColumn('foo', this.getType('integer'));
  diffTable.setPrimaryKey(['foo']);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(comparator.diffTable(table, diffTable)),
      [
        'ALTER TABLE alter_primary_key MODIFY id INT NOT NULL',
        'ALTER TABLE alter_primary_key DROP PRIMARY KEY',
        'ALTER TABLE alter_primary_key ADD PRIMARY KEY (foo)'
      ]
    );
  }.bind(this));
};

p.testDropPrimaryKeyWithAutoincrementColumn = function() {
  var table = new Table("drop_primary_key");

  table.addColumn('id', this.getType('integer'), {"autoincrement": true});
  table.addColumn('foo', this.getType('integer'));
  table.addColumn('bar', this.getType('integer'));
  table.setPrimaryKey(['id', 'foo']);

  var comparator = new Comparator();
  var diffTable = new Table("drop_primary_key");

  diffTable.addColumn('id', this.getType('integer'), {"autoincrement": true});
  diffTable.addColumn('foo', this.getType('integer'));
  diffTable.addColumn('bar', this.getType('integer'));
  diffTable.setPrimaryKey(['id', 'foo']);
  diffTable.dropPrimaryKey();

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getAlterTableSQL(comparator.diffTable(table, diffTable)),
      [
        'ALTER TABLE drop_primary_key MODIFY id INT NOT NULL',
        'ALTER TABLE drop_primary_key DROP PRIMARY KEY'
      ]
    );
  }.bind(this));
};

p.testAddAutoIncrementPrimaryKey = function() {
  var keyTable = new Table('foo');
  
  keyTable.addColumn('id', this.getType('integer'), {"autoincrement": true});
  keyTable.addColumn('baz', this.getType('string'));
  keyTable.setPrimaryKey(['id']);

  var oldTable = new Table('foo');

  oldTable.addColumn('baz', this.getType('string'));

  var c = new Comparator();
  diff = c.diffTable(oldTable, keyTable);

  var sql = this._platform.getAlterTableSQL(diff);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      sql,
      ['ALTER TABLE foo ADD id INT AUTO_INCREMENT NOT NULL, ADD PRIMARY KEY (id)']
    );
  });
};

p.testNamedPrimaryKey = function() {
  var diff = new TableDiff('mytable');
    
  diff.changedIndexes['foo_index'] = new Index('foo_index', ['foo'], true, true);

  var sql = this._platform.getAlterTableSQL(diff);

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      sql,
      [
        'ALTER TABLE mytable DROP PRIMARY KEY',
        'ALTER TABLE mytable ADD PRIMARY KEY (foo)'
      ]
    );
  });
};

p.getBinaryMaxLength = function() {
  return 65535;
};

p.testDoesNotPropagateForeignKeyCreationForNonSupportingEngines = function() {
  var table = new Table("foreign_table");

  table.addColumn('id', this.getType('integer'));
  table.addColumn('fk_id', this.getType('integer'));
  table.addForeignKeyConstraint('foreign_table', ['fk_id'], ['id']);
  table.setPrimaryKey(['id']);

  it('should be the same SQL declaration', function() {
    table.addOption('engine', 'MyISAM');

    assert.deepEqual(
      this._platform.getCreateTableSQL(
        table,
        AbstractPlatform.CREATE_INDEXES | AbstractPlatform.CREATE_FOREIGNKEYS
      ),
      ['CREATE TABLE foreign_table (id INT NOT NULL, fk_id INT NOT NULL, INDEX IDX_5690FFE2A57719D0 (fk_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = MyISAM']
    );

    table.addOption('engine', 'InnoDB');

    assert.deepEqual(
      this._platform.getCreateTableSQL(
        table,
        AbstractPlatform.CREATE_INDEXES | AbstractPlatform.CREATE_FOREIGNKEYS
      ),
      [
        'CREATE TABLE foreign_table (id INT NOT NULL, fk_id INT NOT NULL, INDEX IDX_5690FFE2A57719D0 (fk_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB',
        'ALTER TABLE foreign_table ADD CONSTRAINT FK_5690FFE2A57719D0 FOREIGN KEY (fk_id) REFERENCES foreign_table (id)'
      ]
    );
  }.bind(this));
};

p.testDoesNotPropagateForeignKeyAlterationForNonSupportingEngines = function() {
  var table = new Table("foreign_table");

  table.addColumn('id', this.getType('integer'));
  table.addColumn('fk_id', this.getType('integer'));
  table.addForeignKeyConstraint('foreign_table', ['fk_id'], ['id']);
  table.setPrimaryKey(['id']);

  var addedForeignKeys   = [new ForeignKeyConstraint(['fk_id'], 'foo', ['id'], 'fk_add')];
  var changedForeignKeys = [new ForeignKeyConstraint(['fk_id'], 'bar', ['id'], 'fk_change')];
  var removedForeignKeys = [new ForeignKeyConstraint(['fk_id'], 'baz', ['id'], 'fk_remove')];

  it('should be an empty array', function() {
    var fromTable = clone(table);
    var tableDiff = new TableDiff('foreign_table');

    fromTable.addOption('engine', 'MyISAM');

    tableDiff.fromTable = fromTable;
    tableDiff.addedForeignKeys = addedForeignKeys;
    tableDiff.changedForeignKeys = changedForeignKeys;
    tableDiff.removedForeignKeys = removedForeignKeys;

    assert.equal(this._platform.getAlterTableSQL(tableDiff).length, 0);
  }.bind(this));

  it('should be the same SQL declaration', function() {
    var fromTable = clone(table);
    var tableDiff = new TableDiff('foreign_table');

    fromTable.addOption('engine', 'InnoDB');

    tableDiff.fromTable = table;
    tableDiff.addedForeignKeys = addedForeignKeys;
    tableDiff.changedForeignKeys = changedForeignKeys;
    tableDiff.removedForeignKeys = removedForeignKeys;

    assert.deepEqual(
      this._platform.getAlterTableSQL(tableDiff),
      [
        'ALTER TABLE foreign_table DROP FOREIGN KEY fk_remove',
        'ALTER TABLE foreign_table DROP FOREIGN KEY fk_change',
        'ALTER TABLE foreign_table ADD CONSTRAINT fk_add FOREIGN KEY (fk_id) REFERENCES foo (id)',
        'ALTER TABLE foreign_table ADD CONSTRAINT fk_change FOREIGN KEY (fk_id) REFERENCES bar (id)'
      ]
    )
  }.bind(this));
};

p.getAlterTableRenameIndexSQL = function() {
  return [
    'DROP INDEX idx_foo ON mytable',
    'CREATE INDEX idx_bar ON mytable (id)'
  ];
};

p.getQuotedAlterTableRenameIndexSQL = function() {
  return [
    'DROP INDEX `create` ON `table`',
    'CREATE INDEX `select` ON `table` (id)',
    'DROP INDEX `foo` ON `table`',
    'CREATE INDEX `bar` ON `table` (id)'
  ];
};

p.getAlterTableRenameIndexInSchemaSQL = function() {
  return [
    'DROP INDEX idx_foo ON myschema.mytable',
    'CREATE INDEX idx_bar ON myschema.mytable (id)'
  ];
};

p.getQuotedAlterTableRenameIndexInSchemaSQL = function() {
  return [
    'DROP INDEX `create` ON `schema`.`table`',
    'CREATE INDEX `select` ON `schema`.`table` (id)',
    'DROP INDEX `foo` ON `schema`.`table`',
    'CREATE INDEX `bar` ON `schema`.`table` (id)'
  ];
};

p.testDoesNotPropagateDefaultValuesForUnsupportedColumnTypes = function() {
  var table = new Table("text_blob_default_value");

  table.addColumn('def_text', this.getType('text'), {"default": 'def'});
  table.addColumn('def_text_null', this.getType('text'), {"notnull": false, "default": 'def'});
  table.addColumn('def_blob', this.getType('blob'), {"default": 'def'});
  table.addColumn('def_blob_null', this.getType('blob'), {"notnull": false, "default": 'def'});

  it('should be the same SQL declaration', function() {
    assert.deepEqual(
      this._platform.getCreateTableSQL(table),
      ['CREATE TABLE text_blob_default_value (def_text LONGTEXT NOT NULL, def_text_null LONGTEXT DEFAULT NULL, def_blob LONGBLOB NOT NULL, def_blob_null LONGBLOB DEFAULT NULL) DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ENGINE = InnoDB']
    );
  }.bind(this));

  var diffTable = new Table("text_blob_default_value");

  diffTable.addColumn('def_text', this.getType('text'), {"default": 'def'});
  diffTable.addColumn('def_text_null', this.getType('text'), {"notnull": false, "default": 'def'});
  diffTable.addColumn('def_blob', this.getType('blob'), {"default": 'def'});
  diffTable.addColumn('def_blob_null', this.getType('blob'), {"notnull": false, "default": 'def'});
  diffTable.changeColumn('def_text', {"default": null});
  diffTable.changeColumn('def_text_null', {"default": null});
  diffTable.changeColumn('def_blob', {"default": null});
  diffTable.changeColumn('def_blob_null', {"default": null});

  var comparator = new Comparator();

  it('should an empty array', function() {
    assert.equal(this._platform.getAlterTableSQL(comparator.diffTable(table, diffTable)).length, 0);
  }.bind(this));
};

/**
 * {@inheritdoc}
 */
p.getQuotedAlterTableRenameColumnSQL = function() {
  return [
    "ALTER TABLE mytable " +
    "CHANGE unquoted1 unquoted INT NOT NULL COMMENT 'Unquoted 1', " +
    "CHANGE unquoted2 `where` INT NOT NULL COMMENT 'Unquoted 2', " +
    "CHANGE unquoted3 `foo` INT NOT NULL COMMENT 'Unquoted 3', " +
    "CHANGE `create` reserved_keyword INT NOT NULL COMMENT 'Reserved keyword 1', " +
    "CHANGE `table` `from` INT NOT NULL COMMENT 'Reserved keyword 2', " +
    "CHANGE `select` `bar` INT NOT NULL COMMENT 'Reserved keyword 3', " +
    "CHANGE quoted1 quoted INT NOT NULL COMMENT 'Quoted 1', " +
    "CHANGE quoted2 `and` INT NOT NULL COMMENT 'Quoted 2', " +
    "CHANGE quoted3 `baz` INT NOT NULL COMMENT 'Quoted 3'"
  ];
};

/**
 * {@inheritdoc}
 */
p.getQuotedAlterTableChangeColumnLengthSQL = function() {
  return [
    "ALTER TABLE mytable " +
    "CHANGE unquoted1 unquoted1 VARCHAR(255) NOT NULL COMMENT 'Unquoted 1', " +
    "CHANGE unquoted2 unquoted2 VARCHAR(255) NOT NULL COMMENT 'Unquoted 2', " +
    "CHANGE unquoted3 unquoted3 VARCHAR(255) NOT NULL COMMENT 'Unquoted 3', " +
    "CHANGE `create` `create` VARCHAR(255) NOT NULL COMMENT 'Reserved keyword 1', " +
    "CHANGE `table` `table` VARCHAR(255) NOT NULL COMMENT 'Reserved keyword 2', " +
    "CHANGE `select` `select` VARCHAR(255) NOT NULL COMMENT 'Reserved keyword 3'"
  ];
};

/**
 * {@inheritdoc}
 */
p.getAlterTableRenameColumnSQL = function() {
  return [
    "ALTER TABLE foo CHANGE bar baz INT DEFAULT 666 NOT NULL COMMENT 'rename test'"
  ];
};

/**
 * {@inheritdoc}
 */
p.getQuotesTableIdentifiersInAlterTableSQL = function() {
  return [
    'ALTER TABLE `foo` DROP FOREIGN KEY fk1',
    'ALTER TABLE `foo` DROP FOREIGN KEY fk2',
    'ALTER TABLE `foo` RENAME TO `table`, ADD bloo INT NOT NULL, DROP baz, CHANGE bar bar INT DEFAULT NULL, CHANGE id war INT NOT NULL',
    'ALTER TABLE `table` ADD CONSTRAINT fk_add FOREIGN KEY (fk3) REFERENCES fk_table (id)',
    'ALTER TABLE `table` ADD CONSTRAINT fk2 FOREIGN KEY (fk2) REFERENCES fk_table2 (id)'
  ];
};

/**
 * {@inheritdoc}
 */
p.getCommentOnColumnSQL = function() {
  return [
    "COMMENT ON COLUMN foo.bar IS 'comment'",
    "COMMENT ON COLUMN `Foo`.`BAR` IS 'comment'",
    "COMMENT ON COLUMN `select`.`from` IS 'comment'"
  ];
};

/**
 * {@inheritdoc}
 */
p.getQuotesReservedKeywordInUniqueConstraintDeclarationSQL = function() {
  return 'CONSTRAINT `select` UNIQUE (foo)';
};

/**
 * {@inheritdoc}
 */
p.getQuotesReservedKeywordInIndexDeclarationSQL = function() {
  return 'INDEX `select` (foo)';
};

/**
 * {@inheritdoc}
 */
p.getAlterStringToFixedStringSQL = function() {
  return [
    'ALTER TABLE mytable CHANGE name name CHAR(2) NOT NULL'
  ];
};

/**
 * {@inheritdoc}
 */
p.getGeneratesAlterTableRenameIndexUsedByForeignKeySQL = function() {
  return [
    'ALTER TABLE mytable DROP FOREIGN KEY fk_foo',
    'DROP INDEX idx_foo ON mytable',
    'CREATE INDEX idx_foo_renamed ON mytable (foo)',
    'ALTER TABLE mytable ADD CONSTRAINT fk_foo FOREIGN KEY (foo) REFERENCES foreign_table (id)'
  ];
};
