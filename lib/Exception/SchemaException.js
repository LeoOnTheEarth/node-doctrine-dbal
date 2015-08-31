module.exports = SchemaException;

var Table = require('../Schema/Table.js');
var ForeignKeyConstraint = require('../Schema/ForeignKeyConstraint.js');
var validArg = require('../util.js').validArg;
var php = require('phpjs');
var inherits = require('util').inherits;

/**
 * Class SchemaException
 *
 * @param {string=} message
 * @param {int=}    id
 *
 * @constructor
 */
function SchemaException(message, id) {
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
  this.id = id;
}

inherits(SchemaException, Error);

// Constants
SchemaException.TABLE_DOESNT_EXIST = 10;
SchemaException.TABLE_ALREADY_EXISTS = 20;
SchemaException.COLUMN_DOESNT_EXIST = 30;
SchemaException.COLUMN_ALREADY_EXISTS = 40;
SchemaException.INDEX_DOESNT_EXIST = 50;
SchemaException.INDEX_ALREADY_EXISTS = 60;
SchemaException.SEQUENCE_DOENST_EXIST = 70;
SchemaException.SEQUENCE_ALREADY_EXISTS = 80;
SchemaException.INDEX_INVALID_NAME = 90;
SchemaException.FOREIGNKEY_DOESNT_EXIST = 100;
SchemaException.NAMESPACE_ALREADY_EXISTS = 110;

/**
 * @param {string} tableName
 *
 * @returns {SchemaException}
 */
SchemaException.tableDoesNotExist = function(tableName) {
  return new SchemaException(
    "There is no table with name '" + tableName + "' in the schema.",
    SchemaException.TABLE_DOESNT_EXIST
  );
};

/**
 * @param {string} indexName
 *
 * @returns {SchemaException}
 */
SchemaException.indexNameInvalid = function(indexName) {
  return new SchemaException(
    'Invalid index-name "' + indexName + '" given, has to be [a-zA-Z0-9_]',
    SchemaException.INDEX_INVALID_NAME
  );
};

/**
 * @param {string} indexName
 * @param {string} table
 *
 * @returns {SchemaException}
 */
SchemaException.indexDoesNotExist = function(indexName, table) {
  return new SchemaException(
    "Index '" + indexName + "' does not exist on table '" + table + "'.",
    SchemaException.INDEX_DOESNT_EXIST
  );
};

/**
 * @param {string} indexName
 * @param {string} table
 *
 * @returns {SchemaException}
 */
SchemaException.indexAlreadyExists = function(indexName, table) {
  return new SchemaException(
    "An index with name '" + indexName + "' was already defined on table '" + table + "'.",
    SchemaException.INDEX_ALREADY_EXISTS
  );
};

/**
 * @param {string} columnName
 * @param {string} table
 *
 * @returns {SchemaException}
 */
SchemaException.columnDoesNotExist = function(columnName, table) {
  return new SchemaException(
    "There is no column with name '" + columnName + "' on table '" + table + "'.",
    SchemaException.COLUMN_DOESNT_EXIST
  );
};

/**
 * @param {string} namespaceName
 *
 * @returns {SchemaException}
 */
SchemaException.namespaceAlreadyExists = function(namespaceName) {
  return new SchemaException(
    php.sprintf("The namespace with name '%s' already exists.", namespaceName),
    SchemaException.NAMESPACE_ALREADY_EXISTS
  );
};

/**
 * @param {string} tableName
 *
 * @returns {SchemaException}
 */
SchemaException.tableAlreadyExists = function(tableName) {
  return new SchemaException(
    "The table with name '" + tableName + "' already exists.",
    SchemaException.TABLE_ALREADY_EXISTS
  );
};

/**
 * @param {string} tableName
 * @param {string} columnName
 *
 * @returns {SchemaException}
 */
SchemaException.columnAlreadyExists = function(tableName, columnName) {
  return new SchemaException(
    "The column '" + columnName + "' on table '" + tableName + "' already exists.",
    SchemaException.COLUMN_ALREADY_EXISTS
  );
};

/**
 * @param {string} sequenceName
 *
 * @returns {SchemaException}
 */
SchemaException.sequenceAlreadyExists = function(sequenceName) {
  return new SchemaException(
    "The sequence '" + sequenceName + "' already exists.",
    SchemaException.SEQUENCE_ALREADY_EXISTS
  );
};

/**
 * @param {string} sequenceName
 *
 * @returns {SchemaException}
 */
SchemaException.sequenceDoesNotExist = function(sequenceName) {
  return new SchemaException(
    "There exists no sequence with the name '" + sequenceName + "'.",
    SchemaException.SEQUENCE_DOENST_EXIST
  );
};

/**
 * @param {string} fkName
 * @param {string} table
 *
 * @returns {SchemaException}
 */
SchemaException.foreignKeyDoesNotExist = function(fkName, table) {
  return new SchemaException(
    "There exists no foreign key with the name '" + fkName + "' on table '" + table + "'.",
    SchemaException.FOREIGNKEY_DOESNT_EXIST
  );
};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} foreignKey
 *
 * @returns {SchemaException}
 */
SchemaException.namedForeignKeyRequired = function(localTable, foreignKey) {
  validArg(localTable, 'localTable', Table);
  validArg(foreignKey, 'foreignKey', ForeignKeyConstraint);

  return new SchemaException(
    "The performed schema operation on " + localTable.getName() + " requires a named foreign key, " +
    "but the given foreign key from (" + foreignKey.getColumns().join(', ') + ") onto foreign table " +
    "'" + foreignKey.getForeignTableName() + "' (" + foreignKey.getForeignColumns().join(', ') + ") " +
    "is currently unnamed."
  );
};

/**
 * @param {string} changeName
 *
 * @return {SchemaException}
 */
SchemaException.alterTableChangeNotSupported = function(changeName) {
  return new SchemaException("Alter table change not supported, given '" + changeName + "'");
};
