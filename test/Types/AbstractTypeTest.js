var AbstractType = require('../../lib/Types/AbstractType.js');
var InvalidArgumentException = require('../../lib/Exception/InvalidArgumentException.js');
var inherits = require('util').inherits;

/**
 * Class MockType
 *
 * @constructor
 */
function MockType() {}
inherits(MockType, AbstractType);
MockType.prototype.getName = function() { return 'Mock'; };

describe('Types/AbstractTypeFactory', function() {
  describe('test method getClassName', function() {
    it('should match correct class name', function() {
      var type = new MockType();

      type.getClassName().should.equal('MockType');
    });
  });

  describe('test method toString', function() {
    it('should match correct type name', function() {
      var type = new MockType();

      type.toString().should.equal('Mock');
    });
  });

  describe('test method isDoctrineType', function() {
    it('will throw {InvalidArgumentException} exception', function() {
      var type = new MockType();

      try {
        type.isDoctrineType(123);
      } catch (e) {
        e.should.eql(new InvalidArgumentException(
          'the argument "doctrineType" should be an {String} or {Array<string>} instance, {Number} given'
        ));
      }

      try {
        type.isDoctrineType({"foo":"bar"});
      } catch (e) {
        e.should.eql(new InvalidArgumentException(
          'the argument "doctrineType" should be an {String} or {Array<string>} instance, {Object} given'
        ));
      }
    });

    it('will throw an {Error} exception', function() {
      MockType.prototype.getDoctrineTypeMapping = function() { return {"foo": "bar", "bar": "foo"}; };

      var type = new MockType();

      try {
        type.isDoctrineType('bar');
      } catch (e) {
        e.should.eql(new Error('Type name is not in the doctrineTypeMapping list'));
      }
    });

    it('will match the given results', function() {
      MockType.prototype.getDoctrineTypeMapping = function() { return {"foo": "bar", "mock": "foo"}; };

      var type = new MockType();

      type.isDoctrineType('foo').should.be.true;
      type.isDoctrineType('bar').should.be.false;
    });
  });
});
