module.exports = MethodNotImplementException;

var inherits = require('util').inherits;

/**
 * Class MethodNotImplementException
 *
 * @param {string} methodName
 * @param {int=}   id
 *
 * @constructor
 */
function MethodNotImplementException(methodName, id) {
  var message = 'You MUST implement "' + methodName + '" method!';

  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
  this.id = id;
}

inherits(MethodNotImplementException, Error);
