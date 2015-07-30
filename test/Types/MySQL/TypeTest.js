var TypeFactory = require('../../../lib/Types/MySQL/TypeFactory.js');

var testTypeNames = [
  'Int',
  'TinyInt',
  'SmallInt',
  'MediumInt',
  'BigInt',
  'Float',
  'Double',
  'Decimal',
  'Bit',
  'Char',
  'VarChar',
  'Text',
  'TinyText',
  'MediumText',
  'LongText',
  'Blob',
  'TinyBlob',
  'MediumBlob',
  'LongBlob',
  'Date',
  'Time',
  'Datetime',
  'Timestamp',
  'Enum',
  'Set'
];

describe('Types/MySQL/TypeFactory', function() {
  describe('.getType', function() {
    it('should match correct class name', function() {
      testTypeNames.forEach(function(typeName) {
        var expectedClassName = typeName + 'Type';

        TypeFactory.getType(typeName).getClassName().should.equal(expectedClassName);
      });
    });
  });
});

describe('Types/MySQL/*Type', function() {
  describe('.getName & .toString', function() {
    it('should match correct type name', function() {
      testTypeNames.forEach(function(typeName) {
        var type = TypeFactory.getType(typeName);

        type.getName().should.equal(typeName);
        type.toString().should.equal(typeName);
      });
    });
  });
});
