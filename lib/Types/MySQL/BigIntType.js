module.exports = BigIntType;

var IntType = require('./IntType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class BigIntType
 *
 * @constructor
 */
function BigIntType() {}

inherits(BigIntType, IntType);

/** {@inheritdoc} */
BigIntType.prototype.getSQLDeclaration = function(column) {
  return 'BIGINT' + this.getCommonIntegerTypeSQLDeclaration(column);
};

/** {@inheritdoc} */
BigIntType.prototype.getName = function() {
  return TypeFactory.BIGINT;
};
