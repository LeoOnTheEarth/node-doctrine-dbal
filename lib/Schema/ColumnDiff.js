module.exports = ColumnDiff;

var Column = require('./Column.js');
var Identifier = require('./Identifier.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');
var php = require('phpjs');
var validArg = require('../util.js').validArg;

/**
 * Class ColumnDiff
 *
 * An abstraction class for an asset identifier.
 *
 * Wraps identifier names like column names in indexes / foreign keys
 * in an abstract class for proper quotation capabilities.
 *
 * @param {string}         oldColumnName     Old Column name
 * @param {Column}         column            Base Column instance
 * @param {Array<string>=} changedProperties Changed properties
 * @param {Column=}        fromColumn        From Column instance
 *
 * @constructor
 */
function ColumnDiff(oldColumnName, column, changedProperties, fromColumn) {
  validArg(column, 'column', Column);

  changedProperties = changedProperties ? changedProperties : [];
  fromColumn = fromColumn ? fromColumn : null;

  validArg(changedProperties, 'changedProperties', 'Array');

  if (null !== fromColumn) {
    validArg(fromColumn, 'fromColumn', Column);
  }

  /**
   * @type {string}
   */
  this.oldColumnName = oldColumnName;

  /**
   * @type {Column}
   */
  this.column = column;

  /**
   * @type {Array.<string>}
   */
  this.changedProperties = changedProperties;

  /**
   * @type {Column}
   */
  this.fromColumn = fromColumn;
}

var p = ColumnDiff.prototype;

/**
 * Check the propertyName is changed or not
 *
 * @param {string} propertyName Property name
 *
 * @returns {boolean}
 */
p.hasChanged = function(propertyName) {
  return php.in_array(propertyName, this.changedProperties);
};

/**
 * @returns {Identifier}
 */
p.getOldColumnName = function() {
  return new Identifier(this.oldColumnName);
};
