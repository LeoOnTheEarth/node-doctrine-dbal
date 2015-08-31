var TableDiff = require('../../lib/Schema/TableDiff.js');
var Table = require('../../lib/Schema/Table.js');
var Identifier = require('../../lib/Schema/Identifier.js');
var MockPlatform = require('../Mocks/MockPlatform.js');
var UnitTest = require('../UnitTest.js');
var assert = require('chai').assert;
var gently = new(require('gently'));
var inherits = require('util').inherits;

/**
 * Class TableDiffTest
 *
 * @constructor
 */
function TableDiffTest() {}

inherits(TableDiffTest, UnitTest);

var p = TableDiffTest.prototype;

p.getName = function() {
  return 'Schema/TableDiff';
};

p.testReturnsName = function() {
  var tableDiff = new TableDiff('foo');

  it('should be the same Identifier instance', function() {
    assert.deepEqual(tableDiff.getName(new MockPlatform()), new Identifier('foo'));
  });
};

p.testPrefersNameFromTableObject = function() {
  var platformMock = new MockPlatform();
  var tableMock = new Table('table');
  var tableDiff = new TableDiff('foo');

  gently.expect(tableMock, 'getQuotedName', function(platformMock_) {
    assert.deepEqual(platformMock_, platformMock);

    return 'foo';
  });

  tableDiff.fromTable = tableMock;

  it('should be the same Identifier instance', function() {
    assert.deepEqual(tableDiff.getName(platformMock), new Identifier('foo'));
  });
};

p.testReturnsNewName = function() {
  var tableDiff = new TableDiff('foo');

  it('should not have property "newName"', function() {
    assert.isFalse(tableDiff.getNewName());
  });

  it('should be the same Identifier instance', function() {
    tableDiff.newName = 'bar';

    assert.deepEqual(tableDiff.getNewName(), new Identifier('bar'));
  });
};

(new TableDiffTest()).run();
