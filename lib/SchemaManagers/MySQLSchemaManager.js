module.exports = MySQLSchemaManager;

var AbstractSchemaManager = require('./AbstractSchemaManager.js');
var Connection = require('../Connections/Connection.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var MySQLPlatform = require('../Platforms/MySQLPlatform.js');
var Column = require('../Schema/Column.js');
var View = require('../Schema/View.js');
var ForeignKeyConstraint = require('../Schema/ForeignKeyConstraint.js');
var TypeFactory = require('../Types/MySQL/TypeFactory.js');
var php = require('phpjs');
var validArg = require('../util.js').validArg;
var each = require('../util.js').forEach;
var inherits = require('util').inherits;

/**
 * Class MySQLSchemaManager
 *
 * @param {Connection}       conn
 * @param {AbstractPlatform} platform
 *
 * @constructor
 */
function MySQLSchemaManager(conn, platform) {
  MySQLSchemaManager.super_.call(this, conn, platform);
}

inherits(MySQLSchemaManager, AbstractSchemaManager);

p = MySQLSchemaManager.prototype;

/**
 * @param {Object} view
 *
 * @return {View}
 *
 * @access protected
 */
p._getPortableViewDefinition = function(view) {
  return new View(view['TABLE_NAME'], view['VIEW_DEFINITION']);
};

/**
 * @param {Object} table
 *
 * @return {String}
 */
p._getPortableTableDefinition = function(table) {
  var tableName = '';

  each(table, function(value) {
    tableName = value;

    return false;
  });

  return tableName;
};

/**
 * @param {Object} user
 *
 * @return {Object}
 *
 * @access protected
 */
p._getPortableUserDefinition = function(user) {
  return {
    "user": user['User'],
    "password": user['Password']
  };
};

/**
 * {@inheritdoc}
 */
p._getPortableTableIndexesList = function(tableIndexes, tableName) {
  each(tableIndexes, function(v, k) {
    v['primary'] = (v['key_name'] === 'PRIMARY');

    if (v['index_type'].indexOf('FULLTEXT') !== -1) {
      v['flags'] = ['FULLTEXT'];
    } else if (v['index_type'].indexOf('SPATIAL') !== -1) {
      v['flags'] = ['SPATIAL'];
    }

    tableIndexes[k] = v;
  });

  return MySQLSchemaManager.super_.prototype._getPortableTableIndexesList.call(this, tableIndexes, tableName);
};

/**
 * @param {Object} sequence
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableSequenceDefinition = function(sequence) {
  return php.end(sequence);
};

/**
 * @param {Object} database
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableDatabaseDefinition = function(database) {
  return database['Database'];
};

/**
 * Gets Table Column Definition.
 *
 * @param {Object} tableColumn
 *
 * @return {Column}
 *
 * @access protected
 */
p._getPortableTableColumnDefinition = function(tableColumn) {
  var length = 0;
  var type = tableColumn['type'].toLowerCase();
  var fixed = null;
  var scale = null;
  var precision = null;

  type = php.strtok(type, '(), ');

  if (php.isset(tableColumn['length'])) {
    length = tableColumn['length'];
  } else {
    length = php.strtok('(), ');
  }

  if (!php.isset(tableColumn['name'])) {
    tableColumn['name'] = '';
  }

  switch (type) {
    case 'char':
    case 'binary':
      fixed = true;
      break;
    case 'float':
    case 'double':
    case 'real':
    case 'numeric':
    case 'decimal':
      var match = tableColumn['type'].match(/[A-Za-z]+\(([0-9]+),([0-9]+)\)/);

      if (match) {
        precision = match[1];
        scale = match[2];
        length = null;
      }

      break;
    case 'tinytext':
      length = MySQLPlatform.LENGTH_LIMIT_TINYTEXT;
      break;
    case 'text':
      length = MySQLPlatform.LENGTH_LIMIT_TEXT;
      break;
    case 'mediumtext':
      length = MySQLPlatform.LENGTH_LIMIT_MEDIUMTEXT;
      break;
    case 'tinyblob':
      length = MySQLPlatform.LENGTH_LIMIT_TINYBLOB;
      break;
    case 'blob':
      length = MySQLPlatform.LENGTH_LIMIT_BLOB;
      break;
    case 'mediumblob':
      length = MySQLPlatform.LENGTH_LIMIT_MEDIUMBLOB;
      break;
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
    case 'year':
      length = null;
      break;
  }

  length = php.intval(length);
  length = (length === 0) ? null : length;

  var options = {
    "length":        length,
    "unsigned":      (tableColumn['type'].indexOf('unsigned') !== -1),
    "fixed":         !!fixed,
    "default":       php.isset(tableColumn['default']) ? tableColumn['default'] : null,
    "notnull":       (tableColumn['null'] != 'YES'),
    "scale":         null,
    "precision":     null,
    "autoincrement": (tableColumn['extra'].indexOf('auto_increment') !== -1),
    "comment":       (php.isset(tableColumn['comment']) && tableColumn['comment'] !== '') ? tableColumn['comment'] : null
  };

  if (scale !== null && precision !== null) {
    options['scale'] = scale;
    options['precision'] = precision;
  }

  var column = new Column(tableColumn['field'], TypeFactory.getType(type), options);

  if (php.isset(tableColumn['collation'])) {
    column.setPlatformOption('collation', tableColumn['collation']);
  }

  return column;
};

/**
 * @param {Array<Object>} tableForeignKeys
 *
 * @return {Array<ForeignKeyConstraint>}
 */
p._getPortableTableForeignKeysList = function(tableForeignKeys) {
  var list = {};

  each (tableForeignKeys, function(value) {
    value = php.array_change_key_case(value, 'CASE_LOWER');

    if (!php.isset(list[value['constraint_name']])) {
      if (!php.isset(value['delete_rule']) || value['delete_rule'] === 'RESTRICT') {
        value['delete_rule'] = null;
      }

      if (!php.isset(value['update_rule']) || value['update_rule'] === 'RESTRICT') {
        value['update_rule'] = null;
      }

      list[value['constraint_name']] = {
        "name": value['constraint_name'],
        "local": [],
        "foreign": [],
        "foreignTable": value['referenced_table_name'],
        "onDelete": value['delete_rule'],
        "onUpdate": value['update_rule']
      };
    }

    list[value['constraint_name']]['local'].push(value['column_name']);
    list[value['constraint_name']]['foreign'].push(value['referenced_column_name']);
  });

  var result = [];

  each(list, function(constraint) {
    result.push(new ForeignKeyConstraint(
      php.array_values(constraint['local']),
      constraint['foreignTable'],
      php.array_values(constraint['foreign']),
      constraint['name'],
      {
        "onDelete": constraint['onDelete'],
        "onUpdate": constraint['onUpdate']
      }
    ));
  });

  return result;
};
