module.exports = TimestampType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TimestampType
 *
 * @constructor
 */
function TimestampType() {}

inherits(TimestampType, AbstractType);

/** {@inheritdoc} */
TimestampType.prototype.getSQLDeclaration = function(column) {
  return 'TIMESTAMP';
};

/** {@inheritdoc} */
TimestampType.prototype.getName = function() {
  return TypeFactory.TIMESTAMP;
};
