module.exports = MediumTextType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class MediumTextType
 *
 * @constructor
 */
function MediumTextType() {}

inherits(MediumTextType, AbstractType);

/** {@inheritdoc} */
MediumTextType.prototype.getSQLDeclaration = function(column) {
  return 'MEDIUMTEXT';
};

/** {@inheritdoc} */
MediumTextType.prototype.getName = function() {
  return TypeFactory.MEDIUMTEXT;
};
