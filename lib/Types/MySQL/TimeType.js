module.exports = TimeType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TimeType
 *
 * @constructor
 */
function TimeType() {}

inherits(TimeType, AbstractType);

/** {@inheritdoc} */
TimeType.prototype.getSQLDeclaration = function(column) {
  return 'TIME';
};

/** {@inheritdoc} */
TimeType.prototype.getName = function() {
  return TypeFactory.TIME;
};
