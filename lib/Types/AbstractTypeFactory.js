module.exports = AbstractTypeFactory;

var MethodNotImplementException = require('../Exception/MethodNotImplementException');

/**
 * Class AbstractTypeFactory
 *
 * @constructor
 */
function AbstractTypeFactory() {}

/**
 * Get type instance
 *
 * @param {string} type Type name
 *
 * @returns {AbstractType}
 *
 * @throws Error If not supported on this platform.
 */
AbstractTypeFactory.getType = function(type) {
  throw new MethodNotImplementException('getType');
};
