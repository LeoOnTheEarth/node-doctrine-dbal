module.exports = BitType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class BitType
 *
 * @constructor
 */
function BitType() {}

inherits(BitType, AbstractType);

/** {@inheritdoc} */
BitType.prototype.getSQLDeclaration = function(column) {
  var length = column.length;

  if (length > 64) {
    length = 64;
  } else if (length < 1) {
    length = 1;
  }


  return 'BIT(' + length + ')';
};

/** {@inheritdoc} */
BitType.prototype.getName = function() {
  return TypeFactory.BIT;
};
