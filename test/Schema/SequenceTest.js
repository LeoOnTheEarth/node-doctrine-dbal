var Sequence = require('../../lib/Schema/Sequence.js');
var Table = require('../../lib/Schema/Table.js');
var MySQLTypeFactory = require('../../lib/Types/MySQL/TypeFactory.js');

describe('Schema/Sequence', function() {
  describe('test is autoincrement for', function() {
    it('should be expected return values', function() {
      var table = new Table('foo');
      var sequence = new Sequence('foo_id_seq');
      var sequence2 = new Sequence('bar_id_seq');
      var sequence3 = new Sequence('other.foo_id_seq');

      table.addColumn('id', MySQLTypeFactory.getType('Int'), {"autoincrement": true});
      table.setPrimaryKey(['id']);

      sequence.isAutoIncrementsFor(table).should.equal(true);
      sequence2.isAutoIncrementsFor(table).should.equal(false);
      sequence3.isAutoIncrementsFor(table).should.equal(false);
    });
  });
});
