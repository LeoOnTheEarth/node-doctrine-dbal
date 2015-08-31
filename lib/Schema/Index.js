module.exports = Index;

var Constraint = require('./Constraint.js');
var Identifier = require('./Identifier.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');
var inherits = require('util').inherits;
var validArg = require('../util.js').validArg;

/**
 * Class Index
 *
 * @param {string}             indexName
 * @param {Array<string>}      columns
 * @param {boolean=}           isUnique
 * @param {boolean=}           isPrimary
 * @param {Array<string>=}     flags
 * @param {Object<string, *>=} options
 *
 * @constructor
 */
function Index(indexName, columns, isUnique, isPrimary, flags, options) {
  flags = (undefined === flags) ? [] : flags;
  options = (undefined === options) ? {} : options;

  validArg(columns, 'columns', 'Array');
  validArg(flags, 'flags', 'Array');
  validArg(options, 'options', 'Object');

  Index.super_.call(this);

  isUnique = !!isUnique;
  isPrimary = !!isPrimary;
  isUnique = isUnique || isPrimary;

  /**
   * Asset identifier instances of the column names the index is associated with.
   * {columnName: Identifier}
   *
   * @type {Object<string, Identifier>}
   */
  this._columns = {};

  /**
   * @type {boolean}
   */
  this._isUnique = isUnique;

  /**
   * @type {boolean}
   */
  this._isPrimary = isPrimary;

  /**
   * Platform specific flags for indexes.
   * {flagName: true}
   *
   * @type {Object}
   */
  this._flags = {};

  /**
   * Platform specific options
   *
   * @todo $_flags should eventually be refactored into options
   *
   * @type {Object}
   */
  this._options = options;

  this._setName(indexName);

  columns.forEach(function(columnName) {
    this._addColumn(columnName);
  }.bind(this));
}

inherits(Index, Constraint);

var p = Index.prototype;

/**
 * Add column identifier
 *
 * @param {string} columnName Column name
 *
 * @returns {void}
 *
 * @access protected
 */
p._addColumn = function(columnName) {
  if (typeof columnName !== 'string') {
    throw new InvalidArgumentException(columnName, 'columnName', 'string');
  }

  this._columns[columnName] = new Identifier(columnName);
};

/**
 * Returns the names of the referencing table columns
 * the constraint is associated with.
 *
 * @returns {Array<string>}
 */
p.getColumns = function() {
  return Object.keys(this._columns);
};

/**
 * Returns the quoted representation of the column names
 * the constraint is associated with.
 *
 * But only if they were defined with one or a column name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation
 *
 * @returns {Array<string>}
 */
p.getQuotedColumns = function(platform) {
  var columns = [];

  Object.keys(this._columns).forEach(function(columnName) {
    var column = this._columns[columnName];

    columns.push(column.getQuotedName(platform));
  }.bind(this));

  return columns;
};

/**
 * @returns {Array<string>}
 */
p.getUnquotedColumns = function() {
  var columns = [];

  this.getColumns().forEach(function(columnName) {
    columns.push(this.trimQuotes(columnName));
  }.bind(this));

  return columns;
};

/**
 * Is the index neither unique nor primary key?
 *
 * @returns {boolean}
 */
p.isSimpleIndex = function() {
  return !this._isPrimary && !this._isUnique;
};

/**
 * Check UNIQUE type
 *
 * @returns {boolean}
 */
p.isUnique = function() {
  return this._isUnique;
};

/**
 * Check PRIMARY type
 *
 * @returns {boolean}
 */
p.isPrimary = function() {
  return this._isPrimary;
};

/**
 * @param {string} columnName
 * @param {int}    pos
 *
 * @returns {boolean}
 */
p.hasColumnAtPosition = function(columnName, pos) {
  var indexColumns = this.getUnquotedColumns().map(function(column) {
    return column.toLowerCase();
  });

  columnName = this.trimQuotes(columnName.toLowerCase());

  return indexColumns.indexOf(columnName) === pos;
};

/**
 * Checks if this index exactly spans the given column names in the correct order.
 *
 * @param {Array<string>} columnNames
 *
 * @returns {boolean}
 */
p.spansColumns = function(columnNames) {
  var columns = this.getColumns();
  var numberOfColumns = columns.length;

  if (numberOfColumns !== columnNames.length) {
    return false;
  }

  for (var i = 0; i < numberOfColumns; ++i) {
    if (!columnNames[i] ||
        this.trimQuotes(columns[i].toLowerCase()) !== this.trimQuotes(columnNames[i].toLowerCase())) {
      return false;
    }
  }

  return true;
};

/**
 * Check if the other index already fullfills all the indexing and constraint needs of the current one.
 *
 * @param {Index} other
 *
 * @returns {Boolean}
 */
p.isFullfilledBy = function(other) {
  // Allow the other index to be equally large only. It being larger is an option
  // but it creates a problem with scenarios of the kind PRIMARY KEY(foo,bar) UNIQUE(foo)
  if (other.getColumns().length !== this.getColumns().length) {
    return false;
  }

  // Check if columns are the same, and even in the same order
  var sameColumns = this.spansColumns(other.getColumns());

  if (sameColumns) {
    if (!this.samePartialIndex(other)) {
      return false;
    }

    if (!this.isPrimary() && !this.isUnique()) {
      // this is a special case: If the current key is neither primary or unique, any uniqe or
      // primary key will always have the same effect for the index and there cannot be any constraint
      // overlaps. This means a primary or unique index can always fulfill the requirements of just an
      // index that has no constraints.
      return true;
    }

    if (other.isPrimary() !== this.isPrimary()) {
      return false;
    }

    if (other.isUnique() !== this.isUnique()) {
      return false;
    }

    return true;
  }

  return false;
};

/**
 * Detects if the other index is a non-unique, non primary index that can be overwritten by this one.
 *
 * @param {Index} other
 *
 * @return {boolean}
 */
p.overrules = function(other) {
  if (other.isPrimary()) {
    return false;
  }

  if (this.isSimpleIndex() && other.isUnique()) {
    return false;
  }

  if (this.spansColumns(other.getColumns()) &&
      (this.isPrimary() || this.isUnique()) &&
      this.samePartialIndex(other)) {
    return true;
  }

  return false;
};

/**
 * Returns platform specific flags for indexes.
 *
 * @returns {Array<string>}
 */
p.getFlags = function() {
  return Object.keys(this._flags);
};

/**
 * Add Flag for an index that translates to platform specific handling.
 *
 * @example index.addFlag('CLUSTERED')
 *
 * @param {string} flag
 *
 * @returns {Index}
 */
p.addFlag = function(flag) {
  this._flags[flag.toLowerCase()] = true;

  return this;
};

/**
 * Does this index have a specific flag?
 *
 * @param {string} flag Flag string
 *
 * @returns {boolean}
 */
p.hasFlag = function(flag) {
  return this._flags.hasOwnProperty(flag.toLowerCase());
};

/**
 * Remove a flag
 *
 * @param {string} flag
 *
 * @returns {void}
 */
p.removeFlag = function(flag) {
  flag = flag.toLowerCase();

  if (this.hasFlag(flag)) {
    delete this._flags[flag];
  }
};

/**
 * @param {string} name
 *
 * @return {boolean}
 */
p.hasOption = function(name) {
  return this._options.hasOwnProperty(name.toLowerCase());
};

/**
 * @param {string} name
 *
 * @return {*}
 */
p.getOption = function(name) {
  return this._options[name.toLowerCase()];
};

/**
 * @returns {Object}
 */
p.getOptions = function() {
  return this._options;
};

/**
 * Return whether the two indexes have the same partial index
 *
 * @param {Index} other
 *
 * @returns {boolean}
 *
 * @access private
 */
p.samePartialIndex = function(other) {
  if (this.hasOption('where') && other.hasOption('where') && this.getOption('where') === other.getOption('where')) {
    return true;
  }

  if (!this.hasOption('where') && !other.hasOption('where')) {
    return true;
  }

  return false;
};
