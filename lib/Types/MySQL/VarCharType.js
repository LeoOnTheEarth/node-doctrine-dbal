module.exports = VarCharType;

var AbstractType = require('./../AbstractType.js')
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
  return column.length ? 'VARCHAR(' + column.length + ')' : 'VARCHAR(255)';
};

/** {@inheritdoc} */
VarCharType.prototype.getName = function() {
  return TypeFactory.VARCHAR;
};
