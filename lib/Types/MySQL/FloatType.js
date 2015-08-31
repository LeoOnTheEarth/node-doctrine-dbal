module.exports = FloatType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class FloatType
 *
 * @constructor
 */
function FloatType() {}

inherits(FloatType, AbstractType);

/** {@inheritdoc} */
FloatType.prototype.getSQLDeclaration = function(column) {
  var unsigned = (true === column.unsigned ? ' UNSIGNED' : '');

  return 'FLOAT' + unsigned;
};

/** {@inheritdoc} */
FloatType.prototype.getName = function() {
  return TypeFactory.FLOAT;
};
