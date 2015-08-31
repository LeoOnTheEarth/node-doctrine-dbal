module.exports = DBALException;

var php = require('phpjs');
var inherits = require('util').inherits;

/**
 * Class DBALException
 *
 * @param {string=} message
 *
 * @constructor
 */
function DBALException(message) {
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
}

inherits(DBALException, Error);

/**
 * Not supported exception
 *
 * @param {string} method The not supported method name
 *
 * @returns {DBALException}
 */
DBALException.notSupported = function(method) {
  return new DBALException('Operation "' + method + '" is not supported by platform.');
};

/**
 * @returns {DBALException}
 */
DBALException.invalidPlatformSpecified = function() {
  return new DBALException(
    "Invalid 'platform' option specified, need to give an instance of " +
    '\\Doctrine\\DBAL\\Platforms\\AbstractPlatform.'
  );
};

/**
 * Returns a new instance for an invalid specified platform version.
 *
 * @param {string} version        The invalid platform version given.
 * @param {string} expectedFormat The expected platform version format.
 *
 * @returns {DBALException}
 */
DBALException.invalidPlatformVersionSpecified = function(version, expectedFormat) {
  return new DBALException(
    php.sprintf(
      'Invalid platform version "%s" specified. ' +
      'The platform version has to be specified in the format: "%s".',
      version,
      expectedFormat
    )
  );
};

/**
 * @param {string} tableName
 *
 * @returns {DBALException}
 */
DBALException.invalidTableName = function(tableName) {
  return new DBALException('Invalid table name specified: ' + tableName);
};

/**
 * @param {string} tableName
 *
 * @return {DBALException}
 */
DBALException.noColumnsSpecifiedForTable = function(tableName) {
  return new DBALException('No columns specified for table ' + tableName);
};

/**
 * @param {string} name
 *
 * @return {DBALException}
 */
DBALException.typeExists = function(name) {
  return new DBALException('Type ' + name + ' already exists.');
};

/**
 * @param {string} name
 *
 * @return {DBALException}
 */
DBALException.typeNotFound = function(name) {
  return new DBALException('Type to be overwritten ' + name + ' does not exist.');
};
