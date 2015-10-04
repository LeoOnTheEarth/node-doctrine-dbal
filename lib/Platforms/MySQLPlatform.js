module.exports = MySQLPlatform;

var AbstractPlatform = require('./AbstractPlatform.js');
var Table = require('../Schema/Table.js');
var TableDiff = require('../Schema/TableDiff.js');
var Index = require('../Schema/Index.js');
var Identifier = require('../Schema/Identifier.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var each = require('./../util.js').forEach;
var validArg = require('../util.js').validArg;
var equal = require('array-equal');

function MySQLPlatform() {}

inherits(MySQLPlatform, AbstractPlatform);

var p = MySQLPlatform.prototype;

MySQLPlatform.LENGTH_LIMIT_TINYTEXT   = 255;
MySQLPlatform.LENGTH_LIMIT_TEXT       = 65535;
MySQLPlatform.LENGTH_LIMIT_MEDIUMTEXT = 16777215;
MySQLPlatform.LENGTH_LIMIT_TINYBLOB   = 255;
MySQLPlatform.LENGTH_LIMIT_BLOB       = 65535;
MySQLPlatform.LENGTH_LIMIT_MEDIUMBLOB = 16777215;

/**
 * Gets the TypeFactory instance for this platform
 *
 * @returns {Object}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getTypeFactory = function() {
  return require('../Types/MySQL/TypeFactory.js');
};

/**
 * Adds MySQL-specific LIMIT clause to the query
 * 18446744073709551615 is 2^64-1 maximum of unsigned BIGINT the biggest limit possible
 *
 * @param {string} query
 * @param {int}    limit
 * @param {int}    offset
 *
 * @returns {string}
 */
p.doModifyLimitQuery = function(query, limit, offset) {
  if (limit !== null) {
    query += ' LIMIT ' + limit;

    if (offset !== null) {
      query += ' OFFSET ' + offset;
    }
  } else if (offset !== null) {
    query += ' LIMIT 18446744073709551615 OFFSET ' + offset;
  }

  return query;
};

/** {@inheritdoc} */
p.getIdentifierQuoteCharacter = function() {
  return '`';
};

/** {@inheritdoc} */
p.getRegexpExpression = function() {
  return 'RLIKE';
};

/** {@inheritdoc} */
p.getGuidExpression = function() {
  return 'UUID()';
};

/** {@inheritdoc} */
p.getLocateExpression = function(str, substr, startPos) {
  startPos = startPos ? startPos : false;

  if (false === startPos) {
    return 'LOCATE(' + substr + ', ' + str + ')';
  }

  return 'LOCATE(' + substr + ', ' + str + ', ' + startPos +')';
};

/** {@inheritdoc} */
p.getConcatExpression = function() {
  return 'CONCAT(' + Array.prototype.slice.call(arguments).join(', ') + ')';
};

/** {@inheritdoc} */
p.getDateArithmeticIntervalExpression = function(date, operator, interval, unit) {
  var func = '+' === operator ? 'DATE_ADD' : 'DATE_SUB';

  return func + '(' + date + ', INTERVAL ' + interval + ' ' + unit + ')';
};

/** {@inheritdoc} */
p.getDateDiffExpression = function(date1, date2) {
  return 'DATEDIFF(' + date1 + ', ' + date2 + ')';
};

/** {@inheritdoc} */
p.getListDatabasesSQL = function() {
  return 'SHOW DATABASES';
};

/** {@inheritdoc} */
p.getListTableConstraintsSQL = function(table) {
  return 'SHOW INDEX FROM ' + table;
};

/**
 * {@inheritdoc}
 *
 * Two approaches to listing the table indexes. The information_schema is
 * preferred, because it doesn't cause problems with SQL keywords such as "order" or "table".
 */
p.getListTableIndexesSQL = function(table, currentDatabase) {
  currentDatabase = currentDatabase ? currentDatabase : null;

  if (currentDatabase) {
    var select = [
      'TABLE_NAME AS `table`',
      'NON_UNIQUE AS `non_unique`',
      'INDEX_NAME AS `key_name`',
      'SEQ_IN_INDEX AS `seq_in_index`',
      'COLUMN_NAME AS `column_name`',
      'COLLATION AS `collation`',
      'CARDINALITY AS `cardinality`',
      'SUB_PART AS `sub_part`',
      'PACKED AS `packed`',
      'NULLABLE AS `null`',
      'INDEX_TYPE AS `index_type`',
      'COMMENT AS `comment`'
    ].join(',');
    var from = 'information_schema.STATISTICS';
    var where = [
      "TABLE_NAME = '" + table + "'",
      "TABLE_SCHEMA = '" + currentDatabase + "'"
    ].join(' AND ');

    return 'SELECT ' + select + ' FROM ' + from + ' WHERE ' + where;
  }

  return 'SHOW INDEX FROM ' + table;
};

/** {@inheritdoc} */
p.getListViewsSQL = function(database) {
  return "SELECT * FROM information_schema.VIEWS WHERE TABLE_SCHEMA = '" + database + "'";
};

/** {@inheritdoc} */
p.getListTableForeignKeysSQL = function(table, database) {
  var select = [
    'DISTINCT CONSTRAINT_NAME',
    'COLUMN_NAME',
    'REFERENCED_TABLE_NAME',
    'REFERENCED_COLUMN_NAME'
  ].join(',');
  var from = 'information_schema.KEY_COLUMN_USAGE';
  var databaseNameSql = null === database ? "'" + database + "'" : 'DATABASE()';
  var where = [
    "TABLE_NAME = '" + table + "'",
    "TABLE_SCHEMA = '" + databaseNameSql + "'",
    'REFERENCED_COLUMN_NAME IS NOT NULL'
  ].join(' AND ');

  return 'SELECT ' + select + ' FROM ' + from + ' WHERE ' + where;
};

/** {@inheritdoc} */
p.getCreateViewSQL = function (name, sql) {
  return 'CREATE VIEW ' + name + ' AS ' + sql;
};

/** {@inheritdoc} */
p.getDropViewSQL = function(name) {
  return 'DROP VIEW ' + name;
};

/**
 * {@inheritdoc}
 *
 * MySql prefers "autoincrement" identity columns since sequences can only
 * be emulated with a table.
 */
p.prefersIdentityColumns = function() {
  return true;
};

/**
 * {@inheritdoc}
 *
 * MySql supports this through AUTO_INCREMENT columns.
 */
p.supportsIdentityColumns = function() {
  return true;
};

/** {@inheritdoc} */
p.supportsInlineColumnComments = function() {
  return true;
};

/** {@inheritdoc} */
p.supportsColumnCollation = function() {
  return true;
};

/** {@inheritdoc} */
p.getListTablesSQL = function() {
  return "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'";
};

/** {@inheritdoc} */
p.getListTableColumnsSQL = function(table, database) {
  database = database ? "'" + database + "'" : 'DATABASE()';

  var select = [
    'COLUMN_NAME AS `field`',
    'COLUMN_TYPE AS `type`',
    'IS_NULLABLE AS `null`',
    'COLUMN_KEY AS `key`',
    'COLUMN_DEFAULT AS `default`',
    'EXTRA AS `extra`',
    'COLUMN_COMMENT AS `comment`',
    'CHARACTER_SET_NAME AS `character_set`',
    'COLLATION_NAME AS `collation`'
  ].join(',');
  var where = [
    "TABLE_SCHEMA = " + database,
    "TABLE_NAME = '" + table + "'"
  ].join(' AND ');

  return "SELECT " + select + " FROM information_schema.COLUMNS WHERE " + where;
};

/** {@inheritdoc} */
p.getCreateDatabaseSQL = function(database) {
  return 'CREATE DATABASE ' + this.quoteIdentifier(database);
};

/** {@inheritdoc} */
p.getDropDatabaseSQL = function(database) {
  return 'DROP DATABASE ' + this.quoteIdentifier(database);
};

/**
 * {@inheritdoc}
 */
p._getCreateTableSQL = function(tableName, columns, options) {
  options = options ? options : {};

  var columnListSql = this.getColumnDeclarationListSQL(columns);
  var sql = [];

  if (php.isset(options['uniqueConstraints'])) {
    each(options['uniqueConstraints'], function(definition, name) {
      columnListSql += ', ' + this.getUniqueConstraintDeclarationSQL(name, definition);
    }.bind(this));
  }

  // Add all indexes
  if (php.isset(options['indexes'])) {
    each(options['indexes'], function(definition, index) {
      columnListSql += ', ' + this.getIndexDeclarationSQL(index, definition);
    }.bind(this));
  }

  // Attach all primary keys
  if (!php.empty(options['primary'])) {
    // Get unique primary keys (Equivalent to array_unique in PHP)
    var primaryKeys = php.array_values(php.array_unique(options['primary']));

    columnListSql += ', PRIMARY KEY(' + primaryKeys.join(', ') + ')';
  }

  var query = 'CREATE ';
  var engine = 'INNODB';

  if (options['temporary']) {
    query += 'TEMPORARY ';
  }

  query += 'TABLE ' + tableName + ' (' + columnListSql + ') ';
  query += buildTableOptions(options);
  query += buildPartitionOptions(options);

  sql.push(query);

  if (php.isset(options['engine'])) {
    engine = options['engine'].trim().toUpperCase();
  }

  if (php.isset(options['foreignKeys']) && 'INNODB' === engine) {
    each(options['foreignKeys'], function(definition) {
      sql.push(this.getCreateForeignKeySQL(definition, tableName));
    }.bind(this));
  }

  return sql;
};

/** {@inheritdoc} */
p.getDefaultValueDeclarationSQL = function(field) {
  var type = field['type'];

  // Unset the default value if the given field definition does not allow default values.
  if (type.isDoctrineType(['Text', 'Blob'])) {
    field['default'] = null;
  }

  var sql = MySQLPlatform.super_.prototype.getDefaultValueDeclarationSQL.call(this, field);

  if (php.isset(field['default']) && php.isset(field['type'])) {
    if (type.isDoctrineType('Timestamp')) {
      var defaultValue = '';

      if (field['default'].indexOf('ON UPDATE CURRENT_TIMESTAMP') > -1) {
        defaultValue += 'ON UPDATE CURRENT_TIMESTAMP ';
      }

      if (field['default'].indexOf('CURRENT_TIMESTAMP') > -1) {
        defaultValue += 'CURRENT_TIMESTAMP ';
      }

      if (defaultValue) {
        sql = ' DEFAULT ' + defaultValue;
      }
    }
  }

  return sql;
};


/**
 * Build SQL for table options
 *
 * @param {Object} options
 *
 * @return {string}
 *
 * @access private
 */
function buildTableOptions(options) {
  if (php.isset(options['table_options'])) {
    return options['table_options'];
  }

  var tableOptions = [];

  // Charset
  if (!php.isset(options['charset'])) {
    options['charset'] = 'utf8';
  }

  tableOptions.push('DEFAULT CHARACTER SET ' + options['charset']);

  // Collate
  if (!php.isset(options['collate'])) {
    options['collate'] = 'utf8_unicode_ci';
  }

  tableOptions.push('COLLATE ' + options['collate']);

  // Engine
  if (!php.isset(options['engine'])) {
    options['engine'] = 'InnoDB';
  }

  tableOptions.push('ENGINE = ' + options['engine']);

  // Auto increment
  if (php.isset(options['auto_increment'])) {
    tableOptions.push('AUTO_INCREMENT = ' + options['auto_increment']);
  }

  // Comment
  if (php.isset(options['comment'])) {
    var comment = php.trim(options['comment'], " '");

    tableOptions.push('COMMENT = ' + this.quoteStringLiteral(comment));
  }

  // Row format
  if (php.isset(options['row_format'])) {
    tableOptions.push('ROW_FORMAT = ' +  options['row_format']);
  }

  return tableOptions.join(' ');
}

/**
 * Build SQL for partition options.
 *
 * @param {Object} options
 *
 * @return {string}
 *
 * @access private
 */
function buildPartitionOptions(options) {
  return php.isset(options['partition_options']) ? ' ' + options['partition_options'] : '';
}

/**
 * {@inheritdoc}
 */
p.getAlterTableSQL = function(diff) {
  var columnSql = [];
  var queryParts = [];

  if (diff.newName !== false) {
    queryParts.push('RENAME TO ' + diff.getNewName().getQuotedName(this));
  }

  each(diff.addedColumns, function(column) {
    if (this.onSchemaAlterTableAddColumn(column, diff, columnSql)) {
      return true;
    }

    queryParts.push('ADD ' + this.getColumnDeclarationSQL(column.getQuotedName(this), column.toObject()));
  }.bind(this));

  each(diff.removedColumns, function(column) {
    if (this.onSchemaAlterTableRemoveColumn(column, diff, columnSql)) {
      return true;
    }

    queryParts.push('DROP ' + column.getQuotedName(this));
  }.bind(this));

  each(diff.changedColumns, function(columnDiff) {
    if (this.onSchemaAlterTableChangeColumn(columnDiff, diff, columnSql)) {
      return true;
    }

    var column = columnDiff.column;
    var type = column.getType();

    // Don't propagate default value changes for unsupported column types.
    if (columnDiff.hasChanged('default')
      && columnDiff.changedProperties.length === 1
      && (type.isDoctrineType(['Text', 'Blob']))) {
      return true;
    }

    queryParts.push('CHANGE ' + (columnDiff.getOldColumnName().getQuotedName(this)) + ' '
      + this.getColumnDeclarationSQL(column.getQuotedName(this), column.toObject()));
  }.bind(this));

  each(diff.renamedColumns, function(column, oldColumnName) {
    if (this.onSchemaAlterTableRenameColumn(oldColumnName, column, diff, columnSql)) {
      return true;
    }

    oldColumnName = new Identifier(oldColumnName);

    queryParts.push('CHANGE ' + oldColumnName.getQuotedName(this) + ' '
      + this.getColumnDeclarationSQL(column.getQuotedName(this), column.toObject()));
  }.bind(this));

  if (php.isset(diff.addedIndexes['primary'])) {
    // Get unique primary column names
    var keyColumns = php.array_values(php.array_unique(diff.addedIndexes['primary'].getColumns()));

    queryParts.push('ADD PRIMARY KEY (' + keyColumns.join(', ') + ')');

    delete diff.addedIndexes['primary'];
  }

  var sql = [];
  var tableSql = [];

  if (!this.onSchemaAlterTable(diff, tableSql)) {
    if (queryParts.length > 0) {
      sql.push('ALTER TABLE ' + diff.getName(this).getQuotedName(this) + ' ' + queryParts.join(', '));
    }

    sql = php.array_merge(
      this.getPreAlterTableIndexForeignKeySQL(diff),
      sql,
      this.getPostAlterTableIndexForeignKeySQL(diff)
    );
  }

  return php.array_merge(sql, tableSql, columnSql);
};

/** {@inheritdoc} */
p.getPreAlterTableIndexForeignKeySQL = function(diff) {
  var sql = [];
  var table = diff.getName(this).getQuotedName(this);

  each(diff.removedIndexes, function(remIndex, remKey) {
    // Dropping primary keys requires to unset autoincrement attribute on the particular column first.
    if (remIndex.isPrimary() && diff.fromTable instanceof Table) {
      remIndex.getColumns().forEach(function(columnName) {
        var column = diff.fromTable.getColumn(columnName);

        if (column.getAutoincrement() === true) {
          column.setAutoincrement(false);

          sql.push('ALTER TABLE ' + table + ' MODIFY '
            + this.getColumnDeclarationSQL(column.getQuotedName(this), column.toObject()));

          column.setAutoincrement(true);
        }
      }.bind(this));
    }

    each(diff.addedIndexes, function(addIndex, addKey) {
      if (equal(remIndex.getColumns(), addIndex.getColumns())) {
        var indexClause = 'INDEX ' + addIndex.getName();

        if (addIndex.isPrimary()) {
          indexClause = 'PRIMARY KEY';
        } else if (addIndex.isUnique()) {
          indexClause = 'UNIQUE INDEX ' + addIndex.getName();
        }

        var query = 'ALTER TABLE ' + table + ' DROP INDEX ' + remIndex.getName() + ', '
          + 'ADD ' + indexClause
          + ' (' + this.getIndexFieldDeclarationListSQL(addIndex.getQuotedColumns(this)) + ')';

        sql.push(query);

        delete diff.removedIndexes[remKey];
        delete diff.addedIndexes[addKey];

        return false;
      }
    }.bind(this));
  }.bind(this));

  var engine = 'INNODB';

  if (diff.fromTable instanceof Table && diff.fromTable.hasOption('engine')) {
    engine = diff.fromTable.getOption('engine').trim().toUpperCase();
  }

  // Suppress foreign key constraint propagation on non-supporting engines.
  if ('INNODB' !== engine) {
    diff.addedForeignKeys   = [];
    diff.changedForeignKeys = [];
    diff.removedForeignKeys = [];
  }

  sql = php.array_merge(
    sql,
    this.getPreAlterTableAlterIndexForeignKeySQL(diff),
    MySQLPlatform.super_.prototype.getPreAlterTableIndexForeignKeySQL.call(this, diff),
    this.getPreAlterTableRenameIndexForeignKeySQL(diff)
  );

  return sql;
};

/**
 * @param {TableDiff} diff The table diff to gather the SQL for.
 *
 * @returns {Array<string>}
 *
 * @access private
 */
p.getPreAlterTableAlterIndexForeignKeySQL = function(diff) {
  validArg(diff, 'diff', TableDiff);

  var sql = [];
  var table = diff.getName(this).getQuotedName(this);

  each(diff.changedIndexes, function(changedIndex) {
    // Changed primary key
    if (changedIndex.isPrimary() && diff.fromTable instanceof Table) {
      each(diff.fromTable.getPrimaryKeyColumns(), function(columnName) {
        var column = diff.fromTable.getColumn(columnName);

        // Check if an autoincrement column was dropped from the primary key.
        if (column.getAutoincrement() && ! php.in_array(columnName, changedIndex.getColumns())) {
          // The autoincrement attribute needs to be removed from the dropped column
          // before we can drop and recreate the primary key.
          column.setAutoincrement(false);

          sql.push('ALTER TABLE ' + table + ' MODIFY ' +
            this.getColumnDeclarationSQL(column.getQuotedName(this), column.toObject()));

          // Restore the autoincrement attribute as it might be needed later on
          // by other parts of the table alteration.
          column.setAutoincrement(true);
        }
      }.bind(this));
    }
  }.bind(this));

  return sql;
};

/**
 * @param {TableDiff} diff The table diff to gather the SQL for.
 *
 * @returns {Array<string>}
 *
 * @access protected
 */
p.getPreAlterTableRenameIndexForeignKeySQL = function(diff) {
  var sql = [];
  var tableName = diff.getName(this).getQuotedName(this);

  getRemainingForeignKeyConstraintsRequiringRenamedIndexes(diff).forEach(function(foreignKey) {
    if (!php.in_array(foreignKey, diff.changedForeignKeys, true)) {
      sql.push(this.getDropForeignKeySQL(foreignKey, tableName));
    }
  }.bind(this));

  return sql;
};

/**
 * Returns the remaining foreign key constraints that require one of the renamed indexes.
 *
 * "Remaining" here refers to the diff between the foreign keys currently defined in the associated
 * table and the foreign keys to be removed.
 *
 * @param {TableDiff} diff The table diff to evaluate.
 *
 * @return {Array<Object>}
 *
 * @access private
 */
function getRemainingForeignKeyConstraintsRequiringRenamedIndexes(diff) {
  validArg(diff, 'diff', TableDiff);

  if (php.empty(diff.renamedIndexes) || !(diff.fromTable instanceof Table)) {
    return [];
  }

  var foreignKeys = [];
  var remainingForeignKeys = php.array_diff_key(
    diff.fromTable.getForeignKeys(),
    diff.removedForeignKeys
  );

  each(remainingForeignKeys, function(foreignKey, key) {
    each(diff.renamedIndexes, function(index) {
      if (foreignKey.intersectsIndexColumns(index)) {
        foreignKeys.push(foreignKey);

        return false;
      }
    });
  });

  return foreignKeys;
}

/** {@inheritdoc} */
p.getPostAlterTableIndexForeignKeySQL = function(diff) {
  validArg(diff, 'diff', TableDiff);

  return php.array_merge(
    MySQLPlatform.super_.prototype.getPostAlterTableIndexForeignKeySQL.call(this, diff),
    this.getPostAlterTableRenameIndexForeignKeySQL(diff)
  );
};

/**
 * @param {TableDiff} diff The table diff to gather the SQL for.
 *
 * @return {Array<string>}
 *
 * @access protected
 */
p.getPostAlterTableRenameIndexForeignKeySQL = function(diff) {
  var sql = [];
  var tableName = (false !== diff.newName)
    ? diff.getNewName().getQuotedName(this)
    : diff.getName(this).getQuotedName(this);

  getRemainingForeignKeyConstraintsRequiringRenamedIndexes(diff).forEach(function(foreignKey) {
    if (!php.in_array(foreignKey, diff.changedForeignKeys, true)) {
      sql.push(this.getCreateForeignKeySQL(foreignKey, tableName));
    }
  }.bind(this));

  return sql;
};

/** {@inheritdoc} */
p.getCreateIndexSQLFlags = function(index) {
  var type = '';

  if (index.isUnique()) {
    type += 'UNIQUE ';
  } else if (index.hasFlag('fulltext')) {
    type += 'FULLTEXT ';
  } else if (index.hasFlag('spatial')) {
    type += 'SPATIAL ';
  }

  return type;
};

/** {@inheritdoc} */
p.getAdvancedForeignKeyOptionsSQL = function(foreignKey) {
  var query = '';

  if (foreignKey.hasOption('match')) {
    query += ' MATCH ' + foreignKey.getOption('match');
  }

  query += MySQLPlatform.super_.prototype.getAdvancedForeignKeyOptionsSQL.call(this, foreignKey);

  return query;
};

/** {@inheritdoc} */
p.getDropIndexSQL = function(index, table) {
  table = table ? table : null;

  var indexName;

  if (index instanceof Index) {
    indexName = index.getQuotedName(this);
  } else if (typeof index === 'string') {
    indexName = index;
  } else {
    throw new InvalidArgumentException('MysqlPlatform.getDropIndexSQL() expects "index" parameter to be {String} or {Index} instance.');
  }

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  } else if (typeof table !== 'string') {
    throw new InvalidArgumentException('MysqlPlatform.getDropIndexSQL() expects "table" parameter to be {String} or {Table} instance.');
  }

  if (index instanceof Index && index.isPrimary()) {
    // mysql primary keys are always named "PRIMARY",
    // so we cannot use them in statements because of them being keyword.
    return this.getDropPrimaryKeySQL(table);
  }

  return 'DROP INDEX ' + indexName + ' ON ' + table;
};

/**
 * @param {string} table
 *
 * @return {string}
 *
 * @access protected
 */
p.getDropPrimaryKeySQL = function(table) {
  return 'ALTER TABLE ' + table + ' DROP PRIMARY KEY';
};

/** {@inheritdoc} */
p.getSetTransactionIsolationSQL = function(level) {
  return 'SET SESSION TRANSACTION ISOLATION LEVEL ' + this._getTransactionIsolationLevelSQL(level);
};

/** {@inheritdoc} */
p.getName = function() {
  return 'mysql';
};

/** {@inheritdoc} */
p.getReadLockSQL = function() {
  return 'LOCK IN SHARE MODE';
};

/** {@inheritdoc} */
p.getVarcharMaxLength = function() {
  return 65535;
};

/** {@inheritdoc} */
p.getBinaryMaxLength = function() {
  return 65535;
};

/** {@inheritdoc} */
p.getReservedKeywordsClass = function() {
  return 'MySQLKeywords';
};

/**
 * {@inheritdoc}
 *
 * MySQL commits a transaction implicitly when DROP TABLE is executed, however not
 * if DROP TEMPORARY TABLE is executed.
 */
p.getDropTemporaryTableSQL = function(table) {
  if (table instanceof Table) {
    table = table.getQuotedName(this);
  } else if (typeof table !== 'string') {
    throw new InvalidArgumentException('getDropTemporaryTableSQL() expects "table" parameter to be {String} or {Table} instance.');
  }

  return 'DROP TEMPORARY TABLE ' + table;
};
