module.exports = SmallIntType;

var IntType = require('./IntType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class SmallIntType
 *
 * @constructor
 */
function SmallIntType() {}

inherits(SmallIntType, IntType);

/** {@inheritdoc} */
SmallIntType.prototype.getSQLDeclaration = function(column) {
  return 'SMALLINT' + this.getCommonIntegerTypeSQLDeclaration(column);
};

/** {@inheritdoc} */
SmallIntType.prototype.getName = function() {
  return TypeFactory.SMALLINT;
};
