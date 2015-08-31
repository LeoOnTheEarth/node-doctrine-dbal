module.exports = TableDiff;

var Table = require('./Table.js');
var Identifier = require('./Identifier.js');
var validArg = require('../util.js').validArg;

/**
 * Class TableDiff
 *
 * @param {string}                      tableName
 * @param {Object<string, Column>=}     addedColumns
 * @param {Object<string, ColumnDiff>=} changedColumns
 * @param {Object<string, Column>=}     removedColumns
 * @param {Object<string, Index>=}      addedIndexes
 * @param {Object<string, Index>=}      changedIndexes
 * @param {Object<string, Index>=}      removedIndexes
 * @param {Table=}                      fromTable
 *
 * @constructor
 */
function TableDiff(tableName, addedColumns, changedColumns, removedColumns,
                   addedIndexes, changedIndexes, removedIndexes, fromTable) {
  addedColumns   = addedColumns   ? addedColumns   : {};
  changedColumns = changedColumns ? changedColumns : {};
  removedColumns = removedColumns ? removedColumns : {};
  addedIndexes   = addedIndexes   ? addedIndexes   : {};
  changedIndexes = changedIndexes ? changedIndexes : {};
  removedIndexes = removedIndexes ? removedIndexes : {};
  fromTable = fromTable ? fromTable : null;

  validArg(addedColumns,   'addedColumns',   'Object');
  validArg(changedColumns, 'changedColumns', 'Object');
  validArg(removedColumns, 'removedColumns', 'Object');
  validArg(addedIndexes,   'addedIndexes',   'Object');
  validArg(changedIndexes, 'changedIndexes', 'Object');
  validArg(removedIndexes, 'removedIndexes', 'Object');

  if (fromTable !== null) {
    validArg(fromTable, 'fromTable', Table);
  }

  /**
   * @type {string}
   */
  this.name = tableName;

  /**
   * @type {string|boolean}
   */
  this.newName = false;

  /**
   * All added fields.
   *
   * @type {Object<string, Column>}
   */
  this.addedColumns = addedColumns;

  /**
   * All changed fields.
   *
   * @type {Object<string, ColumnDiff>}
   */
  this.changedColumns = changedColumns;

  /**
   * All removed fields.
   *
   * @type {Object<string, Column>}
   */
  this.removedColumns = removedColumns;

  /**
   * Columns that are only renamed from key to column instance name.
   *
   * @type {Object<string, Column>}
   */
  this.renamedColumns = {};

  /**
   * All added indexes.
   *
   * @type {Object<string, Index>}
   */
  this.addedIndexes = addedIndexes;

  /**
   * All changed indexes.
   *
   * @type {Object<string, Index>}
   */
  this.changedIndexes = changedIndexes;

  /**
   * All removed indexes
   *
   * @type {Object<string, Index>}
   */
  this.removedIndexes = removedIndexes;

  /**
   * Indexes that are only renamed but are identical otherwise.
   *
   * @type {Object<string, Index>}
   */
  this.renamedIndexes = {};

  /**
   * All added foreign key definitions
   *
   * @type {Array<ForeignKeyConstraint>}
   */
  this.addedForeignKeys = [];

  /**
   * All changed foreign keys
   *
   * @type {Array<ForeignKeyConstraint>}
   */
  this.changedForeignKeys = [];

  /**
   * All removed foreign keys
   *
   * @type {Array<ForeignKeyConstraint>}
   */
  this.removedForeignKeys = [];

  /**
   * @type {Table}
   */
  this.fromTable = fromTable;
}

var p = TableDiff.prototype;

/**
 * @param {AbstractPlatform} platform The platform to use for retrieving this table diff's name.
 *
 * @returns {Identifier}
 */
p.getName = function(platform) {
  return new Identifier(
      this.fromTable instanceof Table ? this.fromTable.getQuotedName(platform) : this.name
  );
};

/**
 * @return {Identifier|boolean}
 */
p.getNewName = function() {
  return this.newName ? new Identifier(this.newName) : this.newName;
};
