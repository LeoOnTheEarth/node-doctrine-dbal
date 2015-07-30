module.exports = IntType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class IntType
 *
 * @constructor
 */
function IntType() {}

inherits(IntType, AbstractType);

/** {@inheritdoc} */
IntType.prototype.getSQLDeclaration = function(column) {
  return 'INT' + this.getCommonIntegerTypeSQLDeclaration(column);
};

/**
 * Get common integer type SQL declaration
 *
 * @param {Column} column Column instance
 * @returns {string}
 */
IntType.prototype.getCommonIntegerTypeSQLDeclaration = function(column) {
  var autoincrement = (true === column.autoincrement ? ' AUTO_INCREMENT' : ''),
    unsigned = (true === column.unsigned ? ' UNSIGNED' : '');

  return unsigned + autoincrement;
};

/** {@inheritdoc} */
IntType.prototype.getName = function() {
  return TypeFactory.INT;
};
