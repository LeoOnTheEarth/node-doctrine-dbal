module.exports = ForeignKeyConstraint;

var Constraint = require('./Constraint.js');
var Identifier = require('./Identifier.js');
var Table = require('./Table.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var each = require('../util.js').forEach;

/**
 * * Class ForeignKeyConstraint
 *
 * An abstraction class for a foreign key constraint.
 *
 * @param {Array<string>}      localColumnNames
 * @param {Table|string}       foreignTableName
 * @param {Array<string>}      foreignColumnNames
 * @param {string=}            name
 * @param {Object<string, *>=} options
 *
 * @constructor
 */
function ForeignKeyConstraint(localColumnNames, foreignTableName, foreignColumnNames, name, options) {
  ForeignKeyConstraint.super_.call(this);

  name = name ? name : '';

  /**
   * Instance of the referencing table the foreign key constraint is associated with.
   *
   * @type {Table}
   *
   * @access protected
   */
   this._localTable = null;

  /**
   * Asset identifier instances of the referencing table column names the foreign key constraint is associated with.
   * {columnName: {Identifier}}
   *
   * @type {Object<string, Identifier>}
   *
   * @access protected
   */
  this._localColumnNames = {};

  /**
   * Table or asset identifier instance of the referenced table name the foreign key constraint is associated with.
   *
   * @type Table|Identifier
   *
   * @access protected
   */
  this._foreignTableName = null;

  /**
   * Asset identifier instances of the referenced table column names the foreign key constraint is associated with.
   * {columnName: {Identifier}}
   *
   * @type {Object<string, Identifier>}
   */
  this._foreignColumnNames = {};

  /**
   * Options associated with the foreign key constraint.
   *
   * @type {Object}
   */
  this._options = {};

  this._setName(name);

  function identifierConstructorCallback(column) {
    return new Identifier(column);
  }

  this._localColumnNames = !php.empty(localColumnNames)
    ? php.array_combine(localColumnNames, localColumnNames.map(identifierConstructorCallback))
    : {};

  if (foreignTableName instanceof Table) {
      this._foreignTableName = foreignTableName;
  } else {
      this._foreignTableName = new Identifier(foreignTableName);
  }

  this._foreignColumnNames = foreignColumnNames
    ? php.array_combine(foreignColumnNames, foreignColumnNames.map(identifierConstructorCallback))
    : {};

  this._options = options ? options : this._options;
}

inherits(ForeignKeyConstraint, Constraint);

var p = ForeignKeyConstraint.prototype;

/**
 * Returns the name of the referencing table
 * the foreign key constraint is associated with.
 *
 * @returns {string}
 */
p.getLocalTableName = function() {
  return this._localTable.getName();
};

/**
 * Sets the Table instance of the referencing table
 * the foreign key constraint is associated with.
 *
 * @param {Table} table Instance of the referencing table.
 *
 * @returns {void}
 */
p.setLocalTable = function(table) {
    this._localTable = table;
};

/**
 * @returns {Table}
 */
p.getLocalTable = function() {
  return this._localTable;
};

/**
 * Returns the names of the referencing table columns
 * the foreign key constraint is associated with.
 *
 * @returns {Array<string>}
 */
p.getLocalColumns = function() {
  return Object.keys(this._localColumnNames);
};

/**
 * Returns the quoted representation of the referencing table column names
 * the foreign key constraint is associated with.
 *
 * But only if they were defined with one or the referencing table column name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation.
 *
 * @returns {Array<string>}
 */
p.getQuotedLocalColumns = function(platform) {
  var columns = [];

  each(this._localColumnNames, function(column) {
    columns.push(column.getQuotedName(platform));
  });

  return columns;
};

/**
 * Returns unquoted representation of local table column names for comparison with other FK
 *
 * @returns {Array<string>}
 */
p.getUnquotedLocalColumns = function() {
  return this.getLocalColumns().map(this.trimQuotes);
};

/**
 * Returns unquoted representation of foreign table column names for comparison with other FK
 *
 * @returns {Array<string>}
 */
p.getUnquotedForeignColumns = function() {
  return this.getForeignColumns().map(this.trimQuotes);
};

/**
 * {@inheritDoc}
 *
 * @see getLocalColumns
 */
p.getColumns = function() {
  return this.getLocalColumns();
};

/**
 * Returns the quoted representation of the referencing table column names
 * the foreign key constraint is associated with.
 *
 * But only if they were defined with one or the referencing table column name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation.
 *
 * @see getQuotedLocalColumns
 *
 * @returns {Array<string>}
 */
p.getQuotedColumns = function(platform) {
  return this.getQuotedLocalColumns(platform);
};

/**
 * Returns the name of the referenced table
 * the foreign key constraint is associated with.
 *
 * @returns {string}
 */
p.getForeignTableName = function() {
  return this._foreignTableName.getName();
};

/**
 * Returns the non-schema qualified foreign table name.
 *
 * @returns {string}
 */
p.getUnqualifiedForeignTableName = function() {
  var parts = this._foreignTableName.getName().split('.');

  return parts.pop().toLowerCase();
};

/**
 * Returns the quoted representation of the referenced table name
 * the foreign key constraint is associated with.
 *
 * But only if it was defined with one or the referenced table name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation.
 *
 * @returns {string}
 */
p.getQuotedForeignTableName = function(platform) {
  return this._foreignTableName.getQuotedName(platform);
};

/**
 * Returns the names of the referenced table columns
 * the foreign key constraint is associated with.
 *
 * @returns {Array}
 */
p.getForeignColumns = function() {
  return Object.keys(this._foreignColumnNames);
};

/**
 * Returns the quoted representation of the referenced table column names
 * the foreign key constraint is associated with.
 *
 * But only if they were defined with one or the referenced table column name
 * is a keyword reserved by the platform.
 * Otherwise the plain unquoted value as inserted is returned.
 *
 * @param {AbstractPlatform} platform The platform to use for quotation.
 *
 * @returns {Array<string>}
 */
p.getQuotedForeignColumns = function(platform) {
  var columns = [];

  each(this._foreignColumnNames, function(column) {
    columns.push(column.getQuotedName(platform));
  });

  return columns;
};

/**
 * Returns whether or not a given option
 * is associated with the foreign key constraint.
 *
 * @param {string} name Name of the option to check.
 *
 * @returns {boolean}
 */
p.hasOption = function(name) {
  return php.isset(this._options[name]);
};

/**
 * Returns an option associated with the foreign key constraint.
 *
 * @param {string} name Name of the option the foreign key constraint is associated with.
 *
 * @returns {*}
 */
p.getOption = function(name) {
  return this._options[name];
};

/**
 * Returns the options associated with the foreign key constraint.
 *
 * @returns {Object<string, *>}
 */
p.getOptions = function() {
  return this._options;
};

/**
 * Returns the referential action for UPDATE operations
 * on the referenced table the foreign key constraint is associated with.
 *
 * @returns {string|boolean}
 */
p.onUpdate = function() {
  return this.onEvent('onUpdate');
};

/**
 * Returns the referential action for DELETE operations
 * on the referenced table the foreign key constraint is associated with.
 *
 * @returns {string|boolean}
 */
p.onDelete = function() {
  return this.onEvent('onDelete');
};

/**
 * Returns the referential action for a given database operation
 * on the referenced table the foreign key constraint is associated with.
 *
 * @param {string} event Name of the database operation/event to return the referential action for.
 *
 * @returns {string|boolean}
 */
p.onEvent = function(event) {
  if (php.isset(this._options[event])) {
    var onEvent = this._options[event].toUpperCase();

    if (['NO ACTION', 'RESTRICT'].indexOf(onEvent) === -1) {
      return onEvent;
    }
  }

  return false;
};

/**
 * Checks whether this foreign key constraint intersects the given index columns.
 *
 * Returns `true` if at least one of this foreign key's local columns
 * matches one of the given index's columns, `false` otherwise.
 *
 * @param {Index} index The index to be checked against.
 *
 * @returns {boolean}
 */
p.intersectsIndexColumns = function(index) {
  var result = false;

  each(index.getColumns(), function(indexColumnName) {
    each(this._localColumnNames, function(localColumn) {
      if (indexColumnName.toLowerCase() === localColumn.getName().toLowerCase()) {
        result = true;

        return false;
      }
    }.bind(this));

    return !result;
  }.bind(this));

  return result;
};
