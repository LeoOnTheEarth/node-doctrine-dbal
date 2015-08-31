module.exports = SchemaDiff;

var Schema = require('./Schema.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var validArg = require('../util.js').validArg;

/**
 * Class Schema
 *
 * @param {Object<string, Table>=}     newTables
 * @param {Object<string, TableDiff>=} changedTables
 * @param {Object<string, Table>=}     removedTables
 * @param {Schema=}                    fromSchema
 *
 * @constructor
 */
function SchemaDiff(newTables, changedTables, removedTables, fromSchema) {
  newTables = newTables ? newTables : {};
  changedTables = changedTables ? changedTables : {};
  removedTables = removedTables ? removedTables : {};
  fromSchema = fromSchema ? fromSchema : null;

  validArg(newTables, 'newTables', 'Object');
  validArg(changedTables, 'changedTables', 'Object');
  validArg(removedTables, 'removedTables', 'Object');

  if (fromSchema !== null) {
    validArg(fromSchema , 'fromSchema', Schema);
  }

  /**
   * @type {Schema}
   */
  this.fromSchema = fromSchema;

  /**
   * All added namespaces.
   *
   * @type {Object<string, string>}
   */
  this.newNamespaces = {};

  /**
   * All removed namespaces.
   *
   * @type {Object<string, string>}
   */
  this.removedNamespaces = {};

  /**
   * All added tables.
   *
   * @type {Object<string, Table>}
   */
  this.newTables = newTables;

  /**
   * All changed tables.
   *
   * @type {Object<string, TableDiff>}
   */
  this.changedTables = changedTables;

  /**
   * All removed tables.
   *
   * @type {Object<string, Table>}
   */
  this.removedTables = removedTables;

  /**
   * @type {Array<Sequence>}
   */
  this.newSequences = [];

  /**
   * @type {Array<Sequence>}
   */
  this.changedSequences = [];

  /**
   * @type {Array<Sequence>}
   */
  this.removedSequences = [];

  /**
   * @type {Array<ForeignKeyConstraint>}
   */
  this.orphanedForeignKeys = [];
}

var p = SchemaDiff.prototype;

/**
 * The to save sql mode ensures that the following things don't happen:
 *
 * 1. Tables are deleted
 * 2. Sequences are deleted
 * 3. Foreign Keys which reference tables that would otherwise be deleted.
 *
 * This way it is ensured that assets are deleted which might not be relevant to the metadata schema at all.
 *
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.toSaveSql = function(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  return this._toSql(platform, true);
};

/**
 * @param {AbstractPlatform} platform
 *
 * @returns {Array<string>}
 */
p.toSql = function(platform) {
  validArg(platform, 'platform', AbstractPlatform);

  return this._toSql(platform, false);
};

/**
 * @param {AbstractPlatform} platform
 * @param {boolean}          saveMode
 *
 * @returns {Array<string>}
 *
 * @access protected
 */
p._toSql = function(platform, saveMode) {
  validArg(platform, 'platform', AbstractPlatform);

  saveMode = !!saveMode;

  var sql = [];

  if (platform.supportsSchemas()) {
    Object.keys(this.newNamespaces).forEach(function(newNamespace) {
      sql.push(platform.getCreateSchemaSQL(newNamespace));
    }.bind(this));
  }

  if (platform.supportsForeignKeyConstraints() && saveMode === false) {
    this.orphanedForeignKeys.forEach(function(orphanedForeignKey) {
      sql.push(platform.getDropForeignKeySQL(orphanedForeignKey, orphanedForeignKey.getLocalTableName()));
    });
  }

  if (platform.supportsSequences() === true) {
    this.changedSequences.forEach(function(sequence) {
      sql.push(platform.getAlterSequenceSQL(sequence));
    });


    if (saveMode === false) {
      this.removedSequences.forEach(function(sequence) {
        sql.push(platform.getDropSequenceSQL(sequence));
      });
    }

    this.newSequences.forEach(function(sequence) {
      sql.push(platform.getCreateSequenceSQL(sequence));
    });
  }

  var foreignKeySql = [];

  Object.keys(this.newTables).forEach(function(key) {
    var table = this.newTables[key];

    sql = php.array_merge(sql, platform.getCreateTableSQL(table, AbstractPlatform.CREATE_INDEXES));

    if (platform.supportsForeignKeyConstraints()) {
      var fks = table.getForeignKeys();

      Object.keys(fks).forEach(function(key){
        var foreignKey = fks[key];

        foreignKeySql.push(platform.getCreateForeignKeySQL(foreignKey, table));
      });
    }
  }.bind(this));

  sql = php.array_merge(sql, foreignKeySql);

  if (saveMode === false) {
    Object.keys(this.removedTables).forEach(function(key) {
      var table = this.removedTables[key];

      sql.push(platform.getDropTableSQL(table));
    }.bind(this));
  }

  Object.keys(this.changedTables).forEach(function(key) {
    var tableDiff = this.changedTables[key];

    sql = php.array_merge(sql, platform.getAlterTableSQL(tableDiff));
  }.bind(this));

  return sql;
};
