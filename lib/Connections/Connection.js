module.exports = Connection;

/**
 * Class Connection
 *
 * @constructor
 */
function Connection() {}

var p = Connection.prototype;

/**
 * Constant for transaction isolation level READ UNCOMMITTED.
 */
Connection.TRANSACTION_READ_UNCOMMITTED = 1;
/**
 * Constant for transaction isolation level READ COMMITTED.
 */
Connection.TRANSACTION_READ_COMMITTED = 2;
/**
 * Constant for transaction isolation level REPEATABLE READ.
 */
Connection.TRANSACTION_REPEATABLE_READ = 3;
/**
 * Constant for transaction isolation level SERIALIZABLE.
 */
Connection.TRANSACTION_SERIALIZABLE = 4;
/**
 * Represents an array of ints to be expanded by Doctrine SQL parsing.
 */
Connection.PARAM_INT_ARRAY = 101;
/**
 * Represents an array of strings to be expanded by Doctrine SQL parsing.
 */
Connection.PARAM_STR_ARRAY = 102;
/**
 * Offset by which PARAM_* constants are detected as arrays of the param type.
 */
Connection.ARRAY_PARAM_OFFSET = 100;

/**
 * @returns {Promise}
 */
p.connect = function() {};

/**
 * @param {string}         sql
 * @param {Array<string>=} values
 *
 * @returns {Promise} function resolve({Object|Array<Object>} results)
 */
p.query = function(sql, values) {};

/**
 * @param {string}         sql
 * @param {Array<string>=} values
 *
 * @returns {Promise} function resolve({Array<Object>} results)
 */
p.fetchAll = function(sql, values) {};

/**
 * @return {Promise}
 */
p.getDatabase = function() {};
