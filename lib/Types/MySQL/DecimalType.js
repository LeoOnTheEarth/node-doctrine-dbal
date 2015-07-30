module.exports = DecimalType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class DecimalType
 *
 * @constructor
 */
function DecimalType() {}

inherits(DecimalType, AbstractType);

/** {@inheritdoc} */
DecimalType.prototype.getSQLDeclaration = function(column) {
  var unsigned = (true === column.unsigned ? ' UNSIGNED' : '')
    , precision = column.precision.toString()
    , scale = column.scale.toString();

  return 'DECIMAL(' + precision + ',' + scale + ')' + unsigned;
};

/** {@inheritdoc} */
DecimalType.prototype.getName = function() {
  return TypeFactory.DECIMAL;
};
