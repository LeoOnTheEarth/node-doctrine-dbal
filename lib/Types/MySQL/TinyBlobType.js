module.exports = TinyBlobType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TinyBlobType
 *
 * @constructor
 */
function TinyBlobType() {}

inherits(TinyBlobType, AbstractType);

/** {@inheritdoc} */
TinyBlobType.prototype.getSQLDeclaration = function(column) {
  return 'TINYBLOB';
};

/** {@inheritdoc} */
TinyBlobType.prototype.getName = function() {
  return TypeFactory.TINYBLOB;
};
