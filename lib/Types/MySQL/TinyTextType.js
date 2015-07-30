module.exports = TinyTextType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TinyTextType
 *
 * @constructor
 */
function TinyTextType() {}

inherits(TinyTextType, AbstractType);

/** {@inheritdoc} */
TinyTextType.prototype.getSQLDeclaration = function(column) {
  return 'TINYTEXT';
};

/** {@inheritdoc} */
TinyTextType.prototype.getName = function() {
  return TypeFactory.TINYTEXT;
};
