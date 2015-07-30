module.exports = EnumType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class EnumType
 *
 * @constructor
 */
function EnumType() {}

inherits(EnumType, AbstractType);

/** {@inheritdoc} */
EnumType.prototype.getSQLDeclaration = function(column) {
  if (Array.isArray(column.length)) {
    return 'ENUM(' + column.length.join(',') + ')';
  }

  throw Error('ENUM need value list');
};

/** {@inheritdoc} */
EnumType.prototype.getName = function() {
  return TypeFactory.ENUM;
};
