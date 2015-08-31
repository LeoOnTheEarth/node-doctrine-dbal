module.exports = Identifier;

var AbstractAsset = require('./AbstractAsset.js');
var inherits = require('util').inherits;

/**
 * Class Identifier
 *
 * @param {string} identifier Identifier name to wrap
 *
 * @constructor
 */
function Identifier(identifier) {
  Identifier.super_.call(this);

  this._setName(identifier);
}

inherits(Identifier, AbstractAsset);
