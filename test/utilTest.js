var validArg = require('../lib/util.js').validArg;
var each = require('../lib/util.js').forEach;
var InvalidArgumentException = require('../lib/Exception/InvalidArgumentException.js');
var inherits = require('util').inherits;

/**
 * Test exception
 *
 * @param {function} callback
 *
 * @returns {boolean|InvalidArgumentException} Return {Error} instance when exception occur, else return true
 */
function test(callback) {
  try {
    callback();
  } catch (e) {
    return e;
  }

  return true;
}

describe('function validArg', function() {
  describe('test Array', function() {
    it('should pass safely', function() {
      var arg = [];

      test(function(){ validArg(arg, 'arg', 'Array'); }).should.equal(true);
    });

    it('should throw exception', function() {
      var arg = 123;

      test(function(){ validArg(arg, 'arg', 'Array'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg" should be an {Array} instance, {Number} given'));
    });
  });

  describe('test scalar types', function() {
    var arg1 = true;
    var arg2 = 123;
    var arg3 = 'foo';
    var arg4 = function foo() {};
    var arg5 = {foo: 'bar'};

    it('should pass safely', function() {
      test(function(){ validArg(arg1, 'arg1', 'Boolean');  }).should.equal(true);
      test(function(){ validArg(arg2, 'arg2', 'Number');   }).should.equal(true);
      test(function(){ validArg(arg3, 'arg3', 'String');   }).should.equal(true);
      test(function(){ validArg(arg4, 'arg4', 'Function'); }).should.equal(true);
      test(function(){ validArg(arg5, 'arg5', 'Object');   }).should.equal(true);
    });

    it('should throw exception', function() {
      test(function(){ validArg(arg1, 'arg1', 'Number'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg1" should be an {Number} instance, {Boolean} given'));

      test(function(){ validArg(arg2, 'arg2', 'String'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg2" should be an {String} instance, {Number} given'));

      test(function(){ validArg(arg3, 'arg3', 'Function'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg3" should be an {Function} instance, {String} given'));

      test(function(){ validArg(arg4, 'arg4', 'Object'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg4" should be an {Object} instance, {Function} given'));

      test(function(){ validArg(arg5, 'arg5', 'Boolean'); })
        .should
        .eql(new InvalidArgumentException('the argument "arg5" should be an {Boolean} instance, {Object} given'));
    });
  });

  describe('test Class instances', function() {
    function Foo() {}
    function Bar() {}
    function FooBar() {}

    inherits(Bar, Foo);

    var arg1 = new Foo();
    var arg2 = new Bar();

    it('should pass safely', function() {
      test(function(){ validArg(arg1, 'arg1', Foo);    }).should.equal(true);
      test(function(){ validArg(arg2, 'arg2', Bar);    }).should.equal(true);
      test(function(){ validArg(arg2, 'arg2', Foo);    }).should.equal(true);
      test(function(){ validArg(arg2, 'arg2', Object); }).should.equal(true);
    });

    it('should throw exception', function() {
      test(function(){ validArg(arg1, 'arg1', Bar); })
        .should
        .eql(new InvalidArgumentException('the argument "arg1" should be an {Bar} instance, {Foo} given'));

      test(function(){ validArg(arg2, 'arg2', FooBar); })
        .should
        .eql(new InvalidArgumentException('the argument "arg2" should be an {FooBar} instance, {Bar} given'));
    });
  });
});

describe('function forEach', function() {
  describe('test exceptions', function() {
    var arr = [];
    var expectedException = new TypeError('iterator must be a function');

    test(function(){ each(arr);        }).should.eql(expectedException);
    test(function(){ each(arr, null);  }).should.eql(expectedException);
    test(function(){ each(arr, '');    }).should.eql(expectedException);
    test(function(){ each(arr, /a/);   }).should.eql(expectedException);
    test(function(){ each(arr, true);  }).should.eql(expectedException);
    test(function(){ each(arr, false); }).should.eql(expectedException);
    test(function(){ each(arr, NaN);   }).should.eql(expectedException);
    test(function(){ each(arr, 42);    }).should.eql(expectedException);
  });

  describe('test {Array}', function() {
    var arr = [1, 2, 3];

    it('should iterates over every item', function() {
      var index = 0;

      each(arr, function(){ ++index; });

      index.should.equal(arr.length, 'iterates ' + arr.length.toString() + ' times');
    });

    it('should be first iterator argument', function() {
      var index = 0;

      each(arr, function(item) {
        arr[index].should.eql(item, 'item ' + index.toString() + ' is passed as first argument');

        ++index;
      });
    });

    it('should be second iterator argument', function() {
      var counter = 0;

      each(arr, function(item, index) {
        counter.should.eql(index, 'index ' + index.toString() + ' is passed as second argument');

        ++counter;
      });
    });

    it('should be third iterator argument', function() {
      each(arr, function(item, index, array) {
        arr.should.eql(array, 'array is passed as third argument');
      });
    });

    it('should be context argument', function() {
      var context = {};

      each([1], function() {
        this.should.equal(context, '"this" is the passed context');
      }, context);
    });
  });

  describe('test {Object}', function() {
    var obj = {
      "a": 1,
      "b": 2,
      "c": 3
    };
    var keys = ['a', 'b', 'c'];

    var F = function () {
      this.a = 1;
      this.b = 2;
    };
    F.prototype.c = 3;
    var fKeys = ['a', 'b'];

    it('should iterates over every object literal key', function() {
      var counter = 0;

      each(obj, function() { ++counter; });

      counter.should.equal(keys.length, 'iterated ' + counter.toString() + ' times');
    });

    it('should iterates only over own keys', function() {
      var counter = 0;

      each(new F(), function() { ++counter; });

      counter.should.equal(fKeys.length, 'iterated ' + fKeys.length.toString() + ' times');
    });

    it('should first iterator argument', function() {
      var index = 0;

      each(obj, function(item) {
        obj[keys[index]].should.eql(item, 'item at key ' + keys[index] + ' is passed as first argument');

        ++index;
      });
    });

    it('should be second iterator argument', function() {
      var counter = 0;

      each(obj, function(item, key) {
        keys[counter].should.equal(key, 'key ' + key + ' is passed as second argument');

        ++counter;
      });
    });

    it('should be third iterator argument', function() {
      each(obj, function(item, key, object) {
        obj.should.eql(object, 'object is passed as third argument');
      });
    });

    it('should be context argument', function() {
      var context = {};

      each({"a": 1}, function() {
        this.should.eql(context, '"this" is the passed context');
      }, context);
    });
  });

  describe('test {String}', function() {
    var str = 'str';

    it('should be second iterator argument', function() {
      var counter = 0;

      each(str, function(item, index) {
        counter.should.equal(index, 'index ' + index.toString() + ' is passed as second argument');
        str.charAt(index).should.equal(item);

        ++counter;
      });

      counter.should.equal(str.length, 'iterates ' + str.length.toString() + ' times');
    });
  });
});
