var Column = require('../../lib/Schema/Column.js')
  , MySQLTypeFactory = require('../../lib/Types/MySQL/TypeFactory.js')
  , MySQLPlatform = require('../../lib/Platforms/MySQLPlatform.js');

/**
 * @returns {Column}
 */
function createColumn() {
  var options = {
    "length": 200,
    "precision": 5,
    "scale": 2,
    "unsigned": true,
    "notnull": false,
    "fixed": true,
    "default": "baz",
    "platformOptions": {"foo": "bar"},
    "customSchemaOptions": {"bar": "baz"}
  };
  var intType = MySQLTypeFactory.getType('Int');

  return new Column('foo', intType, options);
}

describe('Schema/Column', function() {
  describe('test get* methods', function() {
    it('should return expected value', function() {
      var column = createColumn();

      column.getName().should.equal('foo');
      column.getType().should.eql(MySQLTypeFactory.getType('Int'));

      column.getLength().should.equal(200);
      column.getPrecision().should.equal(5);
      column.getScale().should.equal(2);
      column.getUnsigned().should.equal(true);
      column.getNotnull().should.equal(false);
      column.getFixed().should.equal(true);
      column.getDefault().should.equal('baz');

      column.getPlatformOptions().should.eql({"foo": "bar"});
      column.hasPlatformOption('foo').should.equal(true);
      column.getPlatformOption('foo').should.equal('bar');
      column.hasPlatformOption('bar').should.equal(false);

      column.getCustomSchemaOptions().should.eql({"bar": "baz"});
      column.hasCustomSchemaOption('bar').should.equal(true);
      column.getCustomSchemaOption('bar').should.equal('baz');
      column.hasCustomSchemaOption('foo').should.equal(false);
    });
  });

  describe('test toObject', function() {
    it('should return expected object', function() {
      var column = createColumn();
      var expected = {
        "name": "foo",
        "type": MySQLTypeFactory.getType('Int'),
        "default": "baz",
        "notnull": false,
        "length": 200,
        "precision": 5,
        "scale": 2,
        "fixed": true,
        "unsigned": true,
        "autoincrement": false,
        "columnDefinition": null,
        "comment": null,
        "foo": "bar",
        "bar": "baz"
      };

      column.toObject().should.eql(expected);
    });
  });

  describe('test quoted column name', function() {
    it('should quote column name as expected', function() {
      var column = new Column('`bar`', MySQLTypeFactory.getType('Int'), {});
      var mysqlPlatform = new MySQLPlatform();

      column.getName().should.equal('bar');
      column.getQuotedName(mysqlPlatform).should.equal('`bar`');
    });
  });

  describe('test column is quoted or not', function() {
    it('should quote column name as expected', function() {
      var type = MySQLTypeFactory.getType('Int');

      [
        {columnName: 'bar',   isQuoted: false},
        {columnName: '`bar`', isQuoted: true},
        {columnName: '"bar"', isQuoted: true},
        {columnName: '[bar]', isQuoted: true}
      ].forEach(function(testCase) {
        var column = new Column(testCase.columnName, type, {});

        column.isQuoted().should.equal(testCase.isQuoted);
      });
    });
  });

  describe('test column comment', function() {
    it('should be expected comment', function() {
      var type = MySQLTypeFactory.getType('Int')
      var column = new Column('bar', type, {});

      (null === column.getComment()).should.equal(true);

      column.setComment('foo');
      column.getComment().should.equal('foo');

      var obj = column.toObject();

      obj['comment'].should.equal('foo');
    });
  });
});
