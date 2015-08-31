module.exports = DatetimeType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class DatetimeType
 *
 * @constructor
 */
function DatetimeType() {}

inherits(DatetimeType, AbstractType);

/** {@inheritdoc} */
DatetimeType.prototype.getSQLDeclaration = function(column) {
  return 'DATETIME';
};

/** {@inheritdoc} */
DatetimeType.prototype.getName = function() {
  return TypeFactory.DATETIME;
};
