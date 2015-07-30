module.exports = SetType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class SetType
 *
 * @constructor
 */
function SetType() {}

inherits(SetType, AbstractType);

/** {@inheritdoc} */
SetType.prototype.getSQLDeclaration = function(column) {
  if (Array.isArray(column.length)) {
    return 'SET(' + column.length.join(',') + ')';
  }

  throw Error('SET need value list');
};

/** {@inheritdoc} */
SetType.prototype.getName = function() {
  return TypeFactory.SET;
};
