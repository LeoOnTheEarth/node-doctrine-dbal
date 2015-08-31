module.exports = MediumBlobType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class MediumBlobType
 *
 * @constructor
 */
function MediumBlobType() {}

inherits(MediumBlobType, AbstractType);

/** {@inheritdoc} */
MediumBlobType.prototype.getSQLDeclaration = function(column) {
  return 'MEDIUMBLOB';
};

/** {@inheritdoc} */
MediumBlobType.prototype.getName = function() {
  return TypeFactory.MEDIUMBLOB;
};
