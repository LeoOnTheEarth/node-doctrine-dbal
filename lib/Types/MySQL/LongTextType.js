module.exports = LongTextType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class LongTextType
 *
 * @constructor
 */
function LongTextType() {}

inherits(LongTextType, AbstractType);

/** {@inheritdoc} */
LongTextType.prototype.getSQLDeclaration = function(column) {
  return 'LONGTEXT';
};

/** {@inheritdoc} */
LongTextType.prototype.getName = function() {
  return TypeFactory.LONGTEXT;
};
