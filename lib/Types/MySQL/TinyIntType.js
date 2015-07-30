module.exports = TinyIntType;

var IntType = require('./IntType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TinyIntType
 *
 * @constructor
 */
function TinyIntType() {}

inherits(TinyIntType, IntType);

/** {@inheritdoc} */
TinyIntType.prototype.getSQLDeclaration = function(column) {
  return 'TINYINT' + this.getCommonIntegerTypeSQLDeclaration(column);
};

/** {@inheritdoc} */
TinyIntType.prototype.getName = function() {
  return TypeFactory.TINYINT;
};
