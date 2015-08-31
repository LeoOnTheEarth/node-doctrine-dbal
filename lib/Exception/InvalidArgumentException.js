module.exports = InvalidArgumentException;

var inherits = require('util').inherits;

/**
 * Class InvalidArgumentException
 *
 * @param {string} message
 * @param {int=}   id
 *
 * @constructor
 */
function InvalidArgumentException(message, id) {
  Error.captureStackTrace(this, this.constructor);

  this.name = this.constructor.name;
  this.message = message;
  this.id = id;
}

inherits(InvalidArgumentException, Error);
