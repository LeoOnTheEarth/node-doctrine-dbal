module.exports = AbstractType;

/**
 * Class AbstractType
 *
 * @constructor
 */
function AbstractType() {}

/**
 * Get SQL declaration
 *
 * @param {Column} column Column instance
 *
 * @returns {string}
 */
AbstractType.prototype.getSQLDeclaration = function(column) {
  throw new Error('You MUST implement "getSQLDeclaration" method!');
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
AbstractType.prototype.getName = function() {
  throw new Error('You MUST implement "getClassName" method!');
};

/**
 * Get Class name
 *
 * @returns {string}
 */
AbstractType.prototype.getClassName = function() {
  return this.getName() + 'Type';
};

/**
 * Get Type name
 *
 * @returns {string}
 */
AbstractType.prototype.toString = function() {
  return this.getName();
};
