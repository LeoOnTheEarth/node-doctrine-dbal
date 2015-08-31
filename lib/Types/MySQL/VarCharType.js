module.exports = VarCharType;

var AbstractType = require('./AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class VarCharType
 *
 * @constructor
 */
function VarCharType() {}

inherits(VarCharType, AbstractType);

/** {@inheritdoc} */
VarCharType.prototype.getSQLDeclaration = function(column) {
  var type = column.fixed ? 'CHAR' : 'VARCHAR';

  return column.length ? type + '(' + column.length + ')' : type + '(255)';
};

/** {@inheritdoc} */
VarCharType.prototype.getName = function() {
  return TypeFactory.VARCHAR;
};
