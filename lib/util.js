var InvalidArgumentException = require('./Exception/InvalidArgumentException.js');

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = {
  /**
   * @param {*}             arg
   * @param {string}        argName
   * @param {string|Object} expectedType  Expected type name or a Type declaration (ex: {Error})
   *
   * @returns {void}
   */
  validArg: function validArg(arg, argName, expectedType) {
    function getInvalidArgumentException(arg, argName, expectedType) {
      if (typeof expectedType !== 'string') {
        var str = expectedType.toString();

        if (str.indexOf('function') === 0) {
          expectedType = (str.match(/function ([^\(]+)/))[1];
        } else if (str.indexOf('object') === 1) {
          expectedType = 'Object';
        }
      }

      var argConstructorName = arg ? arg.constructor.name : arg;
      var message = 'the argument "' + argName + '" should be an {' + expectedType + '} instance, ' +
        '{' + argConstructorName + '} given';

      return new InvalidArgumentException(message);
    }

    if (typeof expectedType !== 'string') {
      if (!(arg instanceof expectedType)) {
        throw getInvalidArgumentException(arg, argName, expectedType);
      }

      return;
    }

    switch (expectedType) {
      case 'Array':
        if (!Array.isArray(arg)) {
          throw getInvalidArgumentException(arg, argName, 'Array');
        }
        break;

      case 'Boolean':
      case 'Number':
      case 'String':
      case 'Function':
        if (typeof arg !== expectedType.toLowerCase()) {
          throw getInvalidArgumentException(arg, argName, expectedType);
        }
        break;

      case 'Object':
        if ('[object Object]' !== toString.call(arg)) {
          throw getInvalidArgumentException(arg, argName, expectedType);
        }
        break;
    }
  },

  forEach: function forEach(obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
      throw new TypeError('iterator must be a function');
    }

    var type = toString.call(obj);

    if ('[object Array]' === type || '[object String]' === type) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (false === fn.call(ctx, obj[i], i, obj)) {
          break;
        }
      }
    } else {
      for (var k in obj) {
        if (hasOwn.call(obj, k) && false === fn.call(ctx, obj[k], k, obj)) {
          break;
        }
      }
    }
  }
};
