module.exports = TextType;

var AbstractType = require('./../AbstractType.js')
  , TypeFactory = require('./TypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TextType
 *
 * @constructor
 */
function TextType() {}

inherits(TextType, AbstractType);

/** {@inheritdoc} */
TextType.prototype.getSQLDeclaration = function(column) {
  return 'TEXT';
};

/** {@inheritdoc} */
TextType.prototype.getName = function() {
  return TypeFactory.TEXT;
};
