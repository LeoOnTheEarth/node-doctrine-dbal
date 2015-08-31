module.exports = Sequence;

var AbstractAsset = require('./AbstractAsset.js');
var php = require('phpjs');
var inherits = require('util').inherits;

/**
 * Class Sequence
 *
 * @param {string} name
 * @param {int}    allocationSize
 * @param {int}    initialValue
 * @param {int}    cache
 *
 * @constructor
 */
function Sequence(name, allocationSize, initialValue, cache) {
  allocationSize = php.is_numeric(allocationSize) ? php.intval(allocationSize) : 1;
  initialValue = php.is_numeric(initialValue) ? php.intval(initialValue) : 1;
  cache = php.is_numeric(cache) ? php.intval(cache) : null;

  Sequence.super_.call(this);

  /**
   * @type {int}
   */
  this.allocationSize = allocationSize;

  /**
   * @type {int}
   */
  this.initialValue = initialValue;

  /**
   * @type {int}
   */
  this.cache = cache;

  this._setName(name);
}

inherits(Sequence, AbstractAsset);

var p = Sequence.prototype;

/**
 * @returns {int}
 */
p.getAllocationSize = function() {
  return this.allocationSize;
};

/**
 * @returns {int}
 */
p.getInitialValue = function() {
  return this.initialValue;
};

/**
 * @returns {int}
 */
p.getCache = function() {
  return this.cache;
};

/**
 * @param {int} allocationSize
 *
 * @returns {Sequence}
 */
p.setAllocationSize = function(allocationSize) {
  this.allocationSize = php.is_numeric(allocationSize) ? allocationSize : 1;

  return this;
};

/**
 * @param {int} initialValue
 *
 * @returns {Sequence}
 */
p.setInitialValue = function(initialValue) {
  this.initialValue = php.is_numeric(initialValue) ? initialValue : 1;

  return this;
};

/**
 * @param {int} cache
 *
 * @returns {Sequence}
 */
p.setCache = function(cache) {
  this.cache = cache;

  return this;
};

/**
 * Checks if this sequence is an autoincrement sequence for a given table.
 *
 * This is used inside the comparator to not report sequences as missing,
 * when the "from" schema implicitly creates the sequences.
 *
 * @param {Table} table
 *
 * @return {boolean}
 */
p.isAutoIncrementsFor = function(table) {
  if (!table.hasPrimaryKey()) {
    return false;
  }

  var pkColumns = table.getPrimaryKey().getColumns();

  if (pkColumns.length !== 1) {
    return false;
  }

  var column = table.getColumn(pkColumns[0]);

  if (!column.getAutoincrement()) {
    return false;
  }

  var sequenceName = this.getShortestName(table.getNamespaceName());
  var tableName = table.getShortestName(table.getNamespaceName());
  var tableSequenceName = php.sprintf('%s_%s_seq', tableName, pkColumns[0]);

  return tableSequenceName === sequenceName;
};

/**
 * @param {AbstractVisitor} visitor
 *
 * @return {void}
 */
p.visit = function(visitor) {
  visitor.acceptSequence(this);
};
