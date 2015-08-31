module.exports = Constraint;

var AbstractAsset = require('./AbstractAsset.js');
var MethodNotImplementException = require('../Exception/MethodNotImplementException');
var inherits = require('util').inherits;

/**
 * Class Constraint
 *
 * Marker interface for constraints
 *
 * @constructor
 */
function Constraint() {
  Constraint.super_.call(this);
}

inherits(Constraint, AbstractAsset);

var p = Constraint.prototype;

/**
 * Returns the names of the referencing table columns
 * the constraint is associated with.
 *
 * @returns {Array<string>}
 */
p.getColumns = function() {
  throw new MethodNotImplementException('getColumns');
};

/**
 * Returns the quoted representation of the column names
 * the constraint is associated with.
 *
 * But only if they were defined with one or a column name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation.
 *
 * @returns {Array<string>}
 */
p.getQuotedColumns = function(platform) {
  throw new MethodNotImplementException('getQuotedColumns');
};
