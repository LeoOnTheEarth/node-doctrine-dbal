var SchemaDiff = require('../../lib/Schema/SchemaDiff.js');
var Table = require('../../lib/Schema/Table.js');
var TableDiff = require('../../lib/Schema/TableDiff.js');
var Sequence = require('../../lib/Schema/Sequence.js');
var ForeignKeyConstraint = require('../../lib/Schema/ForeignKeyConstraint.js');
var AbstractPlatform = require('../../lib/Platforms/AbstractPlatform.js');
var MySQLTypeFactory = require('../../lib/Types/MySQL/TypeFactory.js');
var inherits = require('util').inherits;

/** @TODO create a Mock TypeFactory class */

/*
function createPlatform($unsafe = false)
{
  var platform = $this->getMock('Doctrine\Tests\DBAL\Mocks\MockPlatform');
    $platform->expects($this->exactly(1))
->method('getCreateSchemaSQL')
->with('foo_ns')
  ->will($this->returnValue('create_schema'));
  if ($unsafe) {
      $platform->expects($this->exactly(1))
  ->method('getDropSequenceSql')
  ->with($this->isInstanceOf('Doctrine\DBAL\Schema\Sequence'))
      ->will($this->returnValue('drop_seq'));
  }
    $platform->expects($this->exactly(1))
->method('getAlterSequenceSql')
->with($this->isInstanceOf('Doctrine\DBAL\Schema\Sequence'))
  ->will($this->returnValue('alter_seq'));
    $platform->expects($this->exactly(1))
->method('getCreateSequenceSql')
->with($this->isInstanceOf('Doctrine\DBAL\Schema\Sequence'))
  ->will($this->returnValue('create_seq'));
  if ($unsafe) {
      $platform->expects($this->exactly(1))
  ->method('getDropTableSql')
  ->with($this->isInstanceof('Doctrine\DBAL\Schema\Table'))
      ->will($this->returnValue('drop_table'));
  }
    $platform->expects($this->exactly(1))
->method('getCreateTableSql')
->with($this->isInstanceof('Doctrine\DBAL\Schema\Table'))
  ->will($this->returnValue(array('create_table')));
    $platform->expects($this->exactly(1))
->method('getCreateForeignKeySQL')
->with($this->isInstanceOf('Doctrine\DBAL\Schema\ForeignKeyConstraint'))
  ->will($this->returnValue('create_foreign_key'));
    $platform->expects($this->exactly(1))
->method('getAlterTableSql')
->with($this->isInstanceOf('Doctrine\DBAL\Schema\TableDiff'))
  ->will($this->returnValue(array('alter_table')));
  if ($unsafe) {
      $platform->expects($this->exactly(1))
  ->method('getDropForeignKeySql')
  ->with($this->isInstanceof('Doctrine\DBAL\Schema\ForeignKeyConstraint'), $this->equalTo('local_table'))
      ->will($this->returnValue('drop_orphan_fk'));
  }
    $platform->expects($this->exactly(1))
->method('supportsSchemas')
->will($this->returnValue(true));
    $platform->expects($this->exactly(1))
->method('supportsSequences')
->will($this->returnValue(true));
    $platform->expects($this->exactly(2))
->method('supportsForeignKeyConstraints')
->will($this->returnValue(true));
  return $platform;
}
*/
describe('Schema/SchemaDiff', function() {
  describe('test SchemaDiff#toSql', function() {
    it('should be the same SQL statement', function() {
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

