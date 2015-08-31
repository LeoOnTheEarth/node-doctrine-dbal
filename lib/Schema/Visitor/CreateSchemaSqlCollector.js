module.exports = CreateSchemaSqlCollector;

var AbstractVisitor = require('./AbstractVisitor.js');
var AbstractPlatform = require('../../Platforms/AbstractPlatform.js');
var Table = require('../Table.js');
var Sequence = require('../Sequence.js');
var ForeignKeyConstraint = require('../ForeignKeyConstraint.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var validArg = require('../../util.js').validArg;

/**
 * Class CreateSchemaSqlCollector
 *
 * @param {AbstractPlatform} platform
 *
 * @constructor
 */
function CreateSchemaSqlCollector(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  /**
   * @type {Array<string>}
   *
   * @access private
   */
  this.createNamespaceQueries = [];

  /**
   * @type {Array<string>}
   *
   * @access private
   */
  this.createTableQueries = [];

  /**
   * @type {Array<string>}
   *
   * @access private
   */
  this.createSequenceQueries = [];

  /**
   * @type {Array<string>}
   *
   * @access private
   */
  this.createFkConstraintQueries = [];

  /**
   * @type {AbstractPlatform}
   *
   * @access private
   */
  this.platform = platform;
}

inherits(CreateSchemaSqlCollector, AbstractVisitor);

var p = CreateSchemaSqlCollector.prototype;

/**
 * Accepts a schema namespace name.
 *
 * @param {string} namespaceName The schema namespace name to accept.
 */
p.acceptNamespace = function(namespaceName) {
  if (this.platform.supportsSchemas()) {
    this.createNamespaceQueries = php.array_merge(
      this.createNamespaceQueries,
      [this.platform.getCreateSchemaSQL(namespaceName)]
    );
  }
};

/**
 * @param {Table} table
 */
p.acceptTable = function(table) {
  validArg(table, 'table', Table);

  this.createTableQueries = php.array_merge(this.createTableQueries, [this.platform.getCreateTableSQL(table)]);
};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} fkConstraint
 */
p.acceptForeignKey = function(localTable, fkConstraint) {
  validArg(localTable, 'localTable', Table);
  validArg(fkConstraint, 'fkConstraint', ForeignKeyConstraint);

  if (this.platform.supportsForeignKeyConstraints()) {
    this.createFkConstraintQueries = php.array_merge(
      this.createFkConstraintQueries,
      [this.platform.getCreateForeignKeySQL(fkConstraint, localTable)]
    );
  }
};

/**
 * @param {Sequence} sequence
 */
p.acceptSequence = function(sequence) {
  this.createSequenceQueries = php.array_merge(
    this.createSequenceQueries,
    [this.platform.getCreateSequenceSQL(sequence)]
  );
};

/**
 * @returns {void}
 */
p.resetQueries = function() {
  this.createNamespaceQueries = [];
  this.createTableQueries = [];
  this.createSequenceQueries = [];
  this.createFkConstraintQueries = [];
};

/**
 * Gets all queries collected so far.
 *
 * @returns {Array<string>}
 */
p.getQueries = function() {
  return php.array_merge(
    this.createNamespaceQueries,
    this.createTableQueries,
    this.createSequenceQueries,
    this.createFkConstraintQueries
  );
};
