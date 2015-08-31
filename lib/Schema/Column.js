module.exports = Column;

var AbstractAsset = require('./AbstractAsset.js');
var AbstractType = require('../Types/AbstractType.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var validArg = require('../util.js').validArg;

/**
 * Class Column
 *
 * Object representation of a database column.
 *
 * @param {string}       columnName
 * @param {AbstractType} type
 * @param {Object=}       options
 *
 * @constructor
 */
function Column(columnName, type, options) {
  validArg(type, 'type', AbstractType);

  options = options ? options : {};

  validArg(options, 'options', 'Object');

  Column.super_.call(this);

  /**
   * @type {AbstractType}
   */
  this._type = null;

  /**
   * @type {int}
   */
  this._length = null;

  /**
   * @type {int}
   */
  this._precision = 10;

  /**
   * @type {int}
   */
  this._scale = 0;

  /**
   * @type {boolean}
   */
  this._unsigned = false;

  /**
   * @type {boolean}
   */
  this._fixed = false;

  /**
   * @type {boolean}
   */
  this._notnull = true;

  /**
   * @type {string}
   */
  this._default = null;

  /**
   * @type {Object}
   */
  this._platformOptions = {};

  /**
   * @type {string}
   */
  this._columnDefinition = null;

  /**
   * @type {boolean}
   */
  this._autoincrement = false;

  /**
   * @type {string}
   */
  this._comment = null;

  /**
   * @type {Object}
   */
  this._customSchemaOptions = {};

  this._setName(columnName);
  this.setType(type);
  this.setOptions(options);
}

inherits(Column, AbstractAsset);

var p = Column.prototype;

/**
 * @param {Object} options
 *
 * @returns {Column}
 */
p.setOptions = function(options) {
  Object.keys(options).forEach(function(name) {
    var method = 'set' + php.ucfirst(name);

    if (typeof this[method] === 'function') {
      this[method](options[name]);
    }
  }.bind(this));

  return this;
};

/**
 * @param {AbstractType} type
 *
 * @returns {Column}
 */
p.setType = function(type) {
  this._type = type;

  return this;
};

/**
 * @param {int} length
 *
 * @returns {Column}
 */
p.setLength = function(length) {
  this._length = (length !== null) ? php.intval(length) : null;

  return this;
};

/**
 * @param {int} precision
 *
 * @returns {Column}
 */
p.setPrecision = function(precision) {
  if (!php.is_numeric(precision)) {
    precision = 10; // defaults to 10 when no valid precision is given.
  }

  this._precision = php.intval(precision);

  return this;
};

/**
 * @param {int} scale
 *
 * @returns {Column}
 */
p.setScale = function(scale) {
  if (!php.is_numeric(scale)) {
    scale = 0;
  }

  this._scale = php.intval(scale);

  return this;
};

/**
 * @param {boolean} unsigned
 *
 * @returns {Column}
 */
p.setUnsigned = function(unsigned) {
  this._unsigned = !!unsigned;

  return this;
};

/**
 * @param {boolean} fixed
 *
 * @returns {Column}
 */
p.setFixed = function(fixed) {
  this._fixed = !!fixed;

  return this;
};

/**
 * @param {boolean} notnull
 *
 * @returns {Column}
 */
p.setNotnull = function(notnull) {
  this._notnull = !!notnull;

  return this;
};

/**
 * @param {string} defaultValue
 *
 * @returns {Column}
 */
p.setDefault = function(defaultValue) {
  this._default = defaultValue;

  return this;
};

/**
 * @param {string} name
 * @param {*}      value
 *
 * @returns {Column}
 */
p.setPlatformOption = function(name, value) {
  this._platformOptions[name] = value;

  return this;
};

/**
 * @param {string} name
 *
 * @return {boolean}
 */
p.hasPlatformOption = function(name) {
  return this._platformOptions.hasOwnProperty(name) && php.isset(this._platformOptions[name]);
};

/**
 * @param {Object} platformOptions
 *
 * @returns {Column}
 */
p.setPlatformOptions = function(platformOptions) {
  this._platformOptions = platformOptions;

  return this;
};

/**
 * @param {string} value
 *
 * @returns {Column}
 */
p.setColumnDefinition = function(value) {
  this._columnDefinition = value;

  return this;
};

/**
 * @param {boolean} flag
 *
 * @returns {Column}
 */
p.setAutoincrement = function(flag) {
  this._autoincrement = flag;

  return this;
};

/**
 * @param {string} comment
 *
 * @returns {Column}
 */
p.setComment = function(comment) {
  this._comment = comment;

  return this;
};

/**
 * @param {string} name
 * @param {*}      value
 *
 * @returns {Column}
 */
p.setCustomSchemaOption = function(name, value) {
  this._customSchemaOptions[name] = value;

  return this;
};

/**
 * @param {string} name
 *
 * @returns {boolean}
 */
p.hasCustomSchemaOption = function(name) {
  return this._customSchemaOptions.hasOwnProperty(name) && php.isset(this._customSchemaOptions[name]);
};

/**
 * @param {Object} customSchemaOptions
 *
 * @return {Column}
 */
p.setCustomSchemaOptions = function(customSchemaOptions) {
  this._customSchemaOptions = customSchemaOptions;

  return this;
};

/**
 * @returns {AbstractType}
 */
p.getType = function() {
  return this._type;
};

/**
 * @returns {int}
 */
p.getLength = function() {
  return this._length;
};

/**
 * @returns {int}
 */
p.getPrecision = function() {
  return this._precision;
};

/**
 * @returns {int}
 */
p.getScale = function() {
  return this._scale;
};

/**
 * @returns {boolean}
 */
p.getUnsigned = function() {
  return this._unsigned;
};

/**
 * @returns {boolean}
 */
p.getFixed = function() {
  return this._fixed;
};

/**
 * @returns boolean
 */
p.getNotnull = function() {
  return this._notnull;
};

/**
 * @returns {string}
 */
p.getDefault = function() {
  return this._default;
};

/**
 * @param {string} name
 *
 * @returns {*}
 */
p.getPlatformOption = function(name) {
  return this._platformOptions[name];
};

/**
 * @returns {Object}
 */
p.getPlatformOptions = function() {
  return this._platformOptions;
};

/**
 * @returns {string}
 */
p.getColumnDefinition = function() {
  return this._columnDefinition;
};

/**
 * @returns {boolean}
 */
p.getAutoincrement = function() {
  return this._autoincrement;
};

/**
 * @returns {string}
 */
p.getComment = function() {
  return this._comment;
};

/**
 * @param {string} name
 *
 * @returns {*}
 */
p.getCustomSchemaOption = function(name) {
  return this._customSchemaOptions[name];
};

/**
 * @returns {Object}
 */
p.getCustomSchemaOptions = function() {
  return this._customSchemaOptions;
};

/**
 * @return {Object}
 */
p.toObject = function() {
  var obj = {};

  ['name', 'type', 'length', 'precision', 'scale',
    'unsigned', 'fixed', 'notnull', 'default',
    'columnDefinition', 'autoincrement', 'comment'].forEach(function(name) {
    obj[name] = this['_' + name];
  }.bind(this));

  return php.array_merge(obj, this._platformOptions, this._customSchemaOptions);
};
