module.exports = View;

var AbstractAsset = require('AbstractAsset');
var  inherits = require('util').inherits;

/**
 * @type {string}
 *
 * @access private
 */
var _sql;

/**
 * Class View
 *
 * Representation of a Database View.
 *
 * @param {string} name
 * @param {string} sql
 *
 * @constructor
 */
function View(name, sql) {
  View.super_.call(this);

  this._setName(name);

  _sql = sql;
}

inherits(View, AbstractAsset);

var p = View.prototype;

/**
 * @returns {string}
 */
p.getSql = function() {
  return _sql;
};
