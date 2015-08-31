module.exports = Schema;

var AbstractAsset = require('./AbstractAsset.js');
var Table = require('./Table.js');
var Sequence = require('./Sequence.js');
var Comparator = require('./Comparator.js');
var SchemaConfig = require('./SchemaConfig.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var AbstractVisitor = require('./Visitor/AbstractVisitor');
var SchemaException = require('../Exception/SchemaException.js');
var php = require('phpjs');
var validArg = require('../util.js').validArg;
var each = require('../util.js').forEach;
var inherits = require('util').inherits;

/**
 * Class Schema
 *
 * @param {Array<Table>=}    tables
 * @param {Array<Sequence>=} sequences
 * @param {SchemaConfig=}    schemaConfig
 * @param {Array<string>=}   namespaces
 *
 * @constructor
 */
function Schema(tables, sequences, schemaConfig, namespaces) {
  tables = tables ? tables : {};
  sequences = sequences ? sequences : [];
  schemaConfig = schemaConfig ? schemaConfig : null;
  namespaces = namespaces ? namespaces : [];

  validArg(tables, 'tables', 'Object');
  validArg(sequences, 'sequences', 'Array');
  validArg(namespaces, 'namespaces', 'Array');

  if (schemaConfig === null) {
    schemaConfig = new SchemaConfig();
  } else {
    validArg(schemaConfig, 'schemaConfig', 'SchemaConfig');
  }

  /**
   * The namespaces in this schema.
   *
   * @type {Object<string, string>}
   *
   * @access private
   */
  this.namespaces = {};

  /**
   * @type {Object<string, Table>}
   *
   * @access protected
   */
  this._tables = {};

  /**
   * @type {Object<string, Sequence>}
   *
   * @access protected
   */
  this._sequences = {};

  /**
   * @type {SchemaConfig}
   *
   * @access protected
   */
  this._schemaConfig = schemaConfig;

  this._setName(schemaConfig.getName() ? schemaConfig.getName() : 'public');

  namespaces.forEach(function(namespace) {
    this.createNamespace(namespace);
  }.bind(this));

  each(tables, function(table) {
    this._addTable(table);
  }.bind(this));

  sequences.forEach(function(sequence) {
    this._addSequence(sequence);
  }.bind(this));
}

inherits(Schema, AbstractAsset);

var p = Schema.prototype;

/**
 * @returns {boolean}
 */
p.hasExplicitForeignKeyIndexes = function() {
  return this._schemaConfig.hasExplicitForeignKeyIndexes();
};

/**
 * @param {Table} table
 *
 * @returns {void}
 *
 * @throws {SchemaException}
 *
 * @access protected
 */
p._addTable = function(table) {
  validArg(table, 'table', Table);

  var namespaceName = table.getNamespaceName();
  var tableName = table.getFullQualifiedName(this.getName());

  if (php.isset(this._tables[tableName])) {
    throw SchemaException.tableAlreadyExists(tableName);
  }

  if (!table.isInDefaultNamespace(this.getName()) && ! this.hasNamespace(namespaceName)) {
    this.createNamespace(namespaceName);
  }

  this._tables[tableName] = table;
  table.setSchemaConfig(this._schemaConfig);
};

/**
 * @param {Sequence} sequence
 *
 * @returns {void}
 *
 * @throws {SchemaException}
 *
 * @access protected
 */
p._addSequence = function(sequence) {
  validArg(sequence, 'sequence', Sequence);

  var namespaceName = sequence.getNamespaceName();
  var seqName = sequence.getFullQualifiedName(this.getName());

  if (php.isset(this._sequences[seqName])) {
    throw SchemaException.sequenceAlreadyExists(seqName);
  }

  if (!sequence.isInDefaultNamespace(this.getName()) && ! this.hasNamespace(namespaceName)) {
    this.createNamespace(namespaceName);
  }

  this._sequences[seqName] = sequence;
};

/**
 * Returns the namespaces of this schema.
 *
 * @returns {Object<string, string>} A list of namespace names.
 */
p.getNamespaces = function() {
  return this.namespaces;
};

/**
 * Gets all tables of this schema.
 *
 * @returns {Object<string, Table>}
 */
p.getTables = function() {
  return this._tables;
};

/**
 * @param {string} tableName
 *
 * @returns {Table}
 *
 * @throws {SchemaException}
 */
p.getTable = function(tableName) {
  tableName = this.getFullQualifiedAssetName(tableName);

  if (!php.isset(this._tables[tableName])) {
    throw SchemaException.tableDoesNotExist(tableName);
  }

  return this._tables[tableName];
};

/**
 * @param {string} name
 *
 * @returns {string}
 *
 * @access private
 */
p.getFullQualifiedAssetName = function(name) {
  name = this.getUnquotedAssetName(name);

  if (name.indexOf('.') === -1) {
    name = this.getName() + '.' + name;
  }

  return name.toLowerCase();
};

/**
 * Returns the unquoted representation of a given asset name.
 *
 * @param {string} assetName Quoted or unquoted representation of an asset name.
 *
 * @returns {string}
 *
 * @access private
 */
p.getUnquotedAssetName = function(assetName) {
  if (this.isIdentifierQuoted(assetName)) {
    return this.trimQuotes(assetName);
  }

  return assetName;
};

/**
 * Does this schema have a namespace with the given name?
 *
 * @param {string} namespaceName
 *
 * @returns {boolean}
 */
p.hasNamespace = function(namespaceName) {
  namespaceName = this.getUnquotedAssetName(namespaceName).toLowerCase();

  return php.isset(this.namespaces[namespaceName]);
};

/**
 * Does this schema have a table with the given name?
 *
 * @param {string} tableName
 *
 * @returns {boolean}
 */
p.hasTable = function(tableName) {
  tableName = this.getFullQualifiedAssetName(tableName);

  return php.isset(this._tables[tableName]);
};

/**
 * Gets all table names, prefixed with a schema name, even the default one if present.
 *
 * @returns {Array<string>}
 */
p.getTableNames = function() {
  return Object.keys(this._tables);
};

/**
 * @param {string} sequenceName
 *
 * @returns {boolean}
 */
p.hasSequence = function(sequenceName) {
  sequenceName = this.getFullQualifiedAssetName(sequenceName);

  return php.isset(this._sequences[sequenceName]);
};

/**
 * @param {string} sequenceName
 *
 * @returns {Sequence}
 *
 * @throws {SchemaException}
 */
p.getSequence = function(sequenceName) {
  sequenceName = this.getFullQualifiedAssetName(sequenceName);

  if (!this.hasSequence(sequenceName)) {
    throw SchemaException.sequenceDoesNotExist(sequenceName);
  }

  return this._sequences[sequenceName];
};

/**
 * @returns {Object<string, Sequence>}
 */
p.getSequences = function() {
  return this._sequences;
};

/**
 * Creates a new namespace.
 *
 * @param {string} namespaceName The name of the namespace to create.
 *
 * @returns {Schema} This schema instance.
 *
 * @throws {SchemaException}
 */
p.createNamespace = function(namespaceName) {
  var unquotedNamespaceName = this.getUnquotedAssetName(namespaceName).toLowerCase();

  if (this.namespaces.hasOwnProperty(unquotedNamespaceName)) {
    throw SchemaException.namespaceAlreadyExists(unquotedNamespaceName);
  }

  this.namespaces[unquotedNamespaceName] = namespaceName;

  return this;
};

/**
 * Creates a new table.
 *
 * @param {string} tableName
 *
 * @returns {Table}
 */
p.createTable = function(tableName) {
  var table = new Table(tableName);
  var defaultTableOptions = this._schemaConfig.getDefaultTableOptions();

  this._addTable(table);

  Object.keys(defaultTableOptions).forEach(function(name) {
    var value = defaultTableOptions[name];

    table.addOption(name, value);
  });

  return table;
};

/**
 * Renames a table.
 *
 * @param {string} oldTableName
 * @param {string} newTableName
 *
 * @returns {Schema}
 */
p.renameTable = function(oldTableName, newTableName) {
  var table = this.getTable(oldTableName);

  table._setName(newTableName);

  this.dropTable(oldTableName);
  this._addTable(table);

  return this;
};

/**
 * Drops a table from the schema.
 *
 * @param {string} tableName
 *
 * @returns {Schema}
 */
p.dropTable = function(tableName) {
  tableName = this.getFullQualifiedAssetName(tableName);

  this.getTable(tableName);

  delete this._tables[tableName];

  return this;
};

/**
 * Creates a new sequence.
 *
 * @param {string} sequenceName
 * @param {int=}   allocationSize
 * @param {int=}   initialValue
 *
 * @returns {Sequence}
 */
p.createSequence = function(sequenceName, allocationSize, initialValue) {
  allocationSize = allocationSize ? allocationSize : 1;
  initialValue = initialValue ? initialValue : 1;

  var seq = new Sequence(sequenceName, allocationSize, initialValue);

  this._addSequence(seq);

  return seq;
};

/**
 * @param {string} sequenceName
 *
 * @returns {Schema}
 */
p.dropSequence = function(sequenceName) {
  sequenceName = this.getFullQualifiedAssetName(sequenceName);

  delete this._sequences[sequenceName];

  return this;
};

/**
 * Returns an array of necessary SQL queries to create the schema on the given platform.
 *
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.toSql = function(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  var sqlCollector = new CreateSchemaSqlCollector(platform);

  this.visit(sqlCollector);

  return sqlCollector.getQueries();
};

/**
 * Return an array of necessary SQL queries to drop the schema on the given platform.
 *
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.toDropSql = function(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  var dropSqlCollector = new DropSchemaSqlCollector(platform);

  this.visit(dropSqlCollector);

  return dropSqlCollector.getQueries();
};

/**
 * @param {Schema}           toSchema
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.getMigrateToSql = function(toSchema, platform) {
  validArg(toSchema, 'toSchema', Schema);
  validArg(platform, 'platform', AbstractPlatform);

  var comparator = new Comparator();
  var schemaDiff = comparator.compare(this, toSchema);

  return schemaDiff.toSql(platform);
};

/**
 * @param {Schema}           fromSchema
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.getMigrateFromSql = function(fromSchema, platform) {
  validArg(fromSchema, 'fromSchema', Schema);
  validArg(platform, 'platform', AbstractPlatform);

  var comparator = new Comparator();
  var schemaDiff = comparator.compare(fromSchema, this);

  return schemaDiff.toSql(platform);
};

/**
 * @param {AbstractVisitor} visitor
 *
 * @returns {void}
 */
p.visit = function(visitor) {
  validArg(visitor, 'visitor', AbstractVisitor);

  visitor.acceptSchema(this);

  if (visitor instanceof AbstractVisitor) {
    each(this.namespaces, function(namespace) {
      visitor.acceptNamespace(namespace);
    }.bind(this));
  }

  each(this._tables, function(table) {
    table.visit(visitor);
  }.bind(this));

  each(this._sequences, function(sequence) {
    sequence.visit(visitor);
  }.bind(this));
};
