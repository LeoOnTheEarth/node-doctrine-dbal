module.exports = RemoveNamespacedAssets;

var AbstractVisitor = require('./AbstractVisitor.js');
var Schema = require('../Schema.js');
var Table = require('../Table.js');
var Sequence = require('../Sequence.js');
var ForeignKeyConstraint = require('../ForeignKeyConstraint.js');
var inherits = require('util').inherits;
var validArg = require('../../util.js').validArg;

/**
 * Class RemoveNamespacedAssets
 *
 * Removes assets from a schema that are not in the default namespace.
 *
 * Some databases such as MySQL support cross databases joins, but don't
 * allow to call DDLs to a database from another connected database.
 * Before a schema is serialized into SQL this visitor can cleanup schemas with
 * non default namespaces.
 *
 * This visitor filters all these non-default namespaced tables and sequences
 * and removes them from the SChema instance.
 *
 * @constructor
 */
function RemoveNamespacedAssets() {
  /**
   * @type {Schema}
   *
   * @access private
   */
  this.schema = null;
}

inherits(RemoveNamespacedAssets, AbstractVisitor);

var p = RemoveNamespacedAssets.prototype;

/**
 * @param {Schema} schema
 */
p.acceptSchema = function(schema) {
  validArg(schema, 'schema', Schema);

  this.schema = schema;
};

/**
 * @param {Table} table
 */
p.acceptTable = function(table) {
  validArg(table, 'table', Table);

  if (!table.isInDefaultNamespace(this.schema.getName())) {
    this.schema.dropTable(table.getName());
  }
};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} fkConstraint
 */
p.acceptForeignKey = function(localTable, fkConstraint) {
  validArg(localTable, 'localTable', Table);
  validArg(fkConstraint, 'fkConstraint', ForeignKeyConstraint);

  // The table may already be deleted in a previous
  // RemoveNamespacedAssets#acceptTable call. Removing Foreign keys that
  // point to nowhere.
  if (!this.schema.hasTable(fkConstraint.getForeignTableName())) {
    localTable.removeForeignKey(fkConstraint.getName());
    return;
  }

  var foreignTable = this.schema.getTable(fkConstraint.getForeignTableName());

  if (!foreignTable.isInDefaultNamespace(this.schema.getName())) {
    localTable.removeForeignKey(fkConstraint.getName());
  }
};

/**
 * @param {Sequence} sequence
 */
p.acceptSequence = function(sequence) {
  validArg(sequence, 'sequence', Sequence);

  if (!sequence.isInDefaultNamespace(this.schema.getName())) {
    this.schema.dropSequence(sequence.getName());
  }
};
