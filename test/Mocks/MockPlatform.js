module.exports = MockPlatform;

var AbstractPlatform = require('../../lib/Platforms/AbstractPlatform.js');
var inherits = require('util').inherits;

/**
 * Class MockPlatform
 *
 * @constructor
 */
function MockPlatform() {}

inherits(MockPlatform, AbstractPlatform);

var p = MockPlatform.prototype;

p.getBlobTypeDeclarationSQL = function(field) {
  throw DBALException.notSupported('getBlobTypeDeclarationSQL');
};

p.getBooleanTypeDeclarationSQL = function(columnDef) {};

p.getIntegerTypeDeclarationSQL = function(columnDef) {};

p.getBigIntTypeDeclarationSQL = function(columnDef) {};

p.getSmallIntTypeDeclarationSQL = function(columnDef) {};

p._getCommonIntegerTypeDeclarationSQL = function(columnDef) {};

p.getVarcharTypeDeclarationSQL = function(field) {
  return "DUMMYVARCHAR()";
};

p.getClobTypeDeclarationSQL = function(field) {
  return 'DUMMYCLOB';
};

p.getJsonTypeDeclarationSQL = function(field) {
  return 'DUMMYJSON';
};

p.getBinaryTypeDeclarationSQL = function(field) {
  return 'DUMMYBINARY';
};

p.getVarcharDefaultLength = function() {
  return 255;
};

p.getName = function() {
  return 'mock';
};

p.initializeDoctrineTypeMappings = function() {};

p.getVarcharTypeDeclarationSQLSnippet = function(length, fixed) {};
