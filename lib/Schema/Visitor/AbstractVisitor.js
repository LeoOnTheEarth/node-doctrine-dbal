module.exports = AbstractVisitor;

/**
 * Class AbstractVisitor
 *
 * @constructor
 */
function AbstractVisitor() {}

var p = AbstractVisitor.prototype;

/**
 * @param {Schema} schema
 */
p.acceptSchema = function(schema) {};

/**
 * Accepts a schema namespace name.
 *
 * @param {string} namespaceName The schema namespace name to accept.
 */
p.acceptNamespace = function(namespaceName) {};

/**
 * @param {Table} table
 */
p.acceptTable = function(table) {};

/**
 * @param {Table}  table
 * @param {Column} column
 */
p.acceptColumn = function(table, column) {};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} fkConstraint
 */
p.acceptForeignKey = function(localTable, fkConstraint) {};

/**
 * @param {Table} table
 * @param {Index} index
 */
p.acceptIndex = function(table, index) {};

/**
 * @param {Sequence} sequence
 */
p.acceptSequence = function(sequence) {};
