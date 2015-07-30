module.exports = DateType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class DateType
 *
 * @constructor
 */
function DateType() {}

inherits(DateType, AbstractType);

/** {@inheritdoc} */
DateType.prototype.getSQLDeclaration = function(column) {
  return 'DATE';
};

/** {@inheritdoc} */
DateType.prototype.getName = function() {
  return TypeFactory.DATE;
};
