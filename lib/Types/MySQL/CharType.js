module.exports = CharType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class CharType
 *
 * @constructor
 */
function CharType() {}

inherits(CharType, AbstractType);

/** {@inheritdoc} */
CharType.prototype.getSQLDeclaration = function(column) {
  if (column.length > 255)
  {
    column.length = 255;
  }

  return column.length ? 'CHAR(' + column.length + ')' : 'CHAR(255)';
};

/** {@inheritdoc} */
CharType.prototype.getName = function() {
  return TypeFactory.CHAR;
};
