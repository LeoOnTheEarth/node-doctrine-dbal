module.exports = BlobType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class BlobType
 *
 * @constructor
 */
function BlobType() {}

inherits(BlobType, AbstractType);

/** {@inheritdoc} */
BlobType.prototype.getSQLDeclaration = function(column) {
  return 'BLOB';
};

/** {@inheritdoc} */
BlobType.prototype.getName = function() {
  return TypeFactory.BLOB;
};
