module.exports = MediumIntType;

var IntType = require('./IntType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class MediumIntType
 *
 * @constructor
 */
function MediumIntType() {}

inherits(MediumIntType, IntType);

/** {@inheritdoc} */
MediumIntType.prototype.getSQLDeclaration = function(column) {
  return 'MEDIUMINT' + this.getCommonIntegerTypeSQLDeclaration(column);
};

/** {@inheritdoc} */
MediumIntType.prototype.getName = function() {
  return TypeFactory.MEDIUMINT;
};
