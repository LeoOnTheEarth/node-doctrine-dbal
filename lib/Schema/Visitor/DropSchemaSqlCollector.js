module.exports = DropSchemaSqlCollector;

var AbstractVisitor = require('./AbstractVisitor.js');
var AbstractPlatform = require('../../Platforms/AbstractPlatform.js');
var Table = require('../Table.js');
var Sequence = require('../Sequence.js');
var ForeignKeyConstraint = require('../ForeignKeyConstraint.js');
var SchemaException = require('../../Exception/SchemaException.js');
var inherits = require('util').inherits;
var validArg = require('../../util.js').validArg;
var each = require('../../util.js').forEach;
var hash = require('object-hash');

/**
 * Class DropSchemaSqlCollector
 *
 * @param {AbstractPlatform} platform
 *
 * @constructor
 */
function DropSchemaSqlCollector(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  /**
   * @type {Object<string, Table>}
   *
   * @access private
   */
  this.constraints = {};

  /**
   * @type {Object<string, boolean>}
   *
   * @access private
   */
  this.sequences = {};

  /**
   * @type {Object<string, boolean>}
   *
   * @access private
   */
  this.tables = {};

  /**
   * @type {AbstractPlatform}
   *
   * @access private
   */
  this.platform = platform;

  this.clearQueries();
}

inherits(DropSchemaSqlCollector, AbstractVisitor);

var p = DropSchemaSqlCollector.prototype;

/**
 * @param {Table} table
 */
p.acceptTable = function(table) {
  validArg(table, 'table', Table);

  var key = hash(table);

  if (!this.tables.hasOwnProperty(key)) {
    this.tables[key] = {
      "origin": table,
      "value": true
    };
  }
};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} fkConstraint
 */
p.acceptForeignKey = function(localTable, fkConstraint) {
  validArg(localTable, 'localTable', Table);
  validArg(fkConstraint, 'fkConstraint', ForeignKeyConstraint);

  if (0 ===fkConstraint.getName().length) {
    throw SchemaException.namedForeignKeyRequired(localTable, fkConstraint);
  }

  var key = hash(fkConstraint);

  if (!this.constraints.hasOwnProperty(key)) {
    this.constraints[key] = {
      "origin": fkConstraint,
      "value": localTable
    };
  }
};

/**
 * @param {Sequence} sequence
 */
p.acceptSequence = function(sequence) {
  validArg(sequence, 'sequence', Sequence);

  var key = hash(sequence);

  if (!this.sequences.hasOwnProperty(key)) {
    this.sequences[key] = {
      "origin": sequence,
      "value": true
    };
  }
};

/**
 * @returns {void}
 */
p.clearQueries = function() {
  this.constraints = {};
  this.sequences = {};
  this.tables = {};
};

/**
 * @returns {Array<string>}
 */
p.getQueries = function() {
  var sql = [];

  each(this.constraints, function(value) {
    sql.push(this.platform.getDropForeignKeySQL(value['origin'], value['value']));
  }.bind(this));

  each(this.sequences, function(value) {
    sql.push(this.platform.getDropSequenceSQL(value['origin']));
  }.bind(this));

  each(this.tables, function(value) {
    sql.push(this.platform.getDropTableSQL(value['origin']));
  }.bind(this));

  return sql;
};
