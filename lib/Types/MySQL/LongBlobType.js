module.exports = LongBlobType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class LongBlobType
 *
 * @constructor
 */
function LongBlobType() {}

inherits(LongBlobType, AbstractType);

/** {@inheritdoc} */
LongBlobType.prototype.getSQLDeclaration = function(column) {
  return 'LONGBLOB';
};

/** {@inheritdoc} */
LongBlobType.prototype.getName = function() {
  return TypeFactory.LONGBLOB;
};
