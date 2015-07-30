module.exports = DoubleType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class DoubleType
 *
 * @constructor
 */
function DoubleType() {}

inherits(DoubleType, AbstractType);

/** {@inheritdoc} */
DoubleType.prototype.getSQLDeclaration = function(column) {
  var unsigned = (true === column.unsigned ? ' UNSIGNED' : '');

  return 'DOUBLE' + unsigned;
};

/** {@inheritdoc} */
DoubleType.prototype.getName = function() {
  return TypeFactory.DOUBLE;
};
