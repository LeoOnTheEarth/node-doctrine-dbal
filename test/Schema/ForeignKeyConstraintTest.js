var gently = new (require('gently'));
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var Index = require('../../lib/Schema/Index.js');
var each = require('../../lib/util.js').forEach;

describe('Schema/ForeignKeyConstraint', function() {
  function getIntersectsIndexColumnsData() {
    return [
      [['baz'], false],
      [['baz', 'bloo'], false],

      [['foo'], true],
      [['bar'], true],

      [['foo', 'bar'], true],
      [['bar', 'foo'], true],

      [['foo', 'baz'], true],
      [['baz', 'foo'], true],

      [['bar', 'baz'], true],
      [['baz', 'bar'], true],

      [['foo', 'bloo', 'baz'], true],
      [['bloo', 'foo', 'baz'], true],
      [['bloo', 'baz', 'foo'], true],

      [['FOO'], true]
    ];
  }

  describe('test intersects index columns', function() {
    it('would be the same value', function() {
      each(getIntersectsIndexColumnsData(), function(args) {
        var indexColumns = args[0];
        var expectedResult = args[1];
        var foreignKey = new ForeignKeyConstraint(['foo', 'bar'], 'foreign_table', ['fk_foo', 'fk_bar']);
        var index = new Index('idx', []);

        gently.expect(index, 'getColumns', 1, function() {
          return indexColumns;
        });

        foreignKey.intersectsIndexColumns(index).should.eql(expectedResult);
      });
    });
  });
});
