module.exports = Connection;

function Connection() {}

var prototype = Connection.prototype;

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
