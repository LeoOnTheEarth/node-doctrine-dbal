module.exports = AbstractType;

var MethodNotImplementException = require('../Exception/MethodNotImplementException.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');

/**
 * Class AbstractType
 *
 * @constructor
 */
function AbstractType() {}

var p = AbstractType.prototype;

/**
 * Get SQL declaration
 *
 * @param {Column} column Column instance
 *
 * @returns {string}
 */
p.getSQLDeclaration = function(column) {
  throw new MethodNotImplementException('getSQLDeclaration');
};

/**
 * Get Type name
 *
 * The name MUST be declare in {Type.XXX} constants
 * The {Type.XXX} constant value MUST be the column type name in each platform
 * The {Type.XXX} constant value also MUST be the class name without 'Type' suffix
 * For examples:
 *   - A IntType class, there MUST be a constant Type.INT, and its value is 'Int'
 *   - A BitIntType class, there MUST be a constant Type.BIGINT, and its value is 'BigInt'
 *
 * @returns {string}
 */
p.getName = function() {
  throw new MethodNotImplementException('getName');
};

/**
 * Get Class name
 *
 * @returns {string}
 */
p.getClassName = function() {
  return this.getName() + 'Type';
};

/**
 * Get Type name
 *
 * @returns {string}
 */
p.toString = function() {
  return this.getName();
};

/**
 * Get mappings between Platform's type and Doctrine's type
 *
 * Return value formats:
 * ```js
 * {
 *   "PlatformType1": "DoctrineType1",
 *   "PlatformType2": "DoctrineType2",
 *   "PlatformType3": "DoctrineType3",
 *   "PlatformType4": "DoctrineType1",
 *   "PlatformType5": "DoctrineType2",
 *   ...
 * }
 * ```
 *
 * @returns {Object<string, string>}
 */
p.getDoctrineTypeMapping = function() {
  throw new MethodNotImplementException('getDoctrineTypeMapping');
};

/**
 * Check if this type class is one of the given Doctrine types
 *
 * @param {string|Array<string>} doctrineType Doctrine type name or an array of Doctrine type names
 *
 * @returns {boolean}
 */
p.isDoctrineType = function(doctrineType) {
  if (typeof doctrineType === 'string') {
    doctrineType = [doctrineType];
  }

  if (!Array.isArray(doctrineType)) {
    throw new InvalidArgumentException(
      'the argument "doctrineType" should be an {String} or {Array<string>} instance, ' +
      '{' + doctrineType.constructor.name + '} given'
    );
  }

  var name = this.getName().toLowerCase();
  var mapping = this.getDoctrineTypeMapping();

  if (!mapping.hasOwnProperty(name)) {
    throw new Error('Type name is not in the doctrineTypeMapping list');
  }

  var result = false;

  doctrineType.forEach(function(type) {
    if (mapping[name] === type.toLowerCase()) {
      result = true;

      return false;
    }
  }.bind(this));

  return result;
};
