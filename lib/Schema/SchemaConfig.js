module.exports = SchemaConfig;

/**
 * Class SchemaConfig
 *
 * Configuration for a Schema
 *
 * @constructor
 */
function SchemaConfig() {
  /**
   * @type {boolean}
   */
  this.hasExplicitForeignKeyIndexes = false;

  /**
   * @type {int}
   */
  this.maxIdentifierLength = 63;

  /**
   * @type {string}
   */
  this.name = null;

  /**
   * @type {Object}
   */
  this.defaultTableOptions = {};
}

var p = SchemaConfig.prototype;

/**
 * @returns {boolean}
 */
p.hasExplicitForeignKeyIndexes = function() {
  return this.hasExplicitForeignKeyIndexes;
};

/**
 * @param {boolean} flag
 *
 * @returns {void}
 */
p.setExplicitForeignKeyIndexes = function(flag) {
  this.hasExplicitForeignKeyIndexes = !!flag;
};

/**
 * @param {int} length
 *
 * @returns {void}
 */
p.setMaxIdentifierLength = function(length) {
  this.maxIdentifierLength = parseInt(length);
};

/**
 * @returns {int}
 */
p.getMaxIdentifierLength = function() {
  return this.maxIdentifierLength;
};

/**
 * Gets the default namespace of schema objects.
 *
 * @returns {string}
 */
p.getName = function() {
  return this.name;
};

/**
 * Sets the default namespace name of schema objects.
 *
 * @param {string} name The value to set.
 *
 * @returns {void}
 */
p.setName = function(name) {
  this.name = name;
};

/**
 * Gets the default options that are passed to Table instances created with
 * Schema#createTable().
 *
 * @returns {Object}
 */
p.getDefaultTableOptions = function() {
  return this.defaultTableOptions;
};

/**
 * @param {Object} defaultTableOptions
 *
 * @returns {void}
 */
p.setDefaultTableOptions = function(defaultTableOptions) {
  if (typeof defaultTableOptions !== 'object') {
    throw new Error('the argument "defaultTableOptions" should be an {Object} instance');
  }

  this.defaultTableOptions = defaultTableOptions;
};
