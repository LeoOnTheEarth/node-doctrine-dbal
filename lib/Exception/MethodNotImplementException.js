module.exports = MethodNotImplementException;

var inherits = require('util').inherits;

/**
 * Class MethodNotImplementException
 *
 * @param {string} methodName
 *
 * @constructor
 */
function MethodNotImplementException(methodName) {
  var message = 'You MUST implement "' + methodName + '" method!';

  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
}

inherits(MethodNotImplementException, Error);
