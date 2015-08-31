module.exports = MySQLAbstractType;

var AbstractType = require('../AbstractType.js');
var inherits = require('util').inherits;

/**
 * Class AbstractType
 *
 * @constructor
 */
function MySQLAbstractType() {}

inherits(MySQLAbstractType, AbstractType);

/** @inheritdoc */
MySQLAbstractType.prototype.getDoctrineTypeMapping = function() {
  return {
    "bigint"    : "bigint",
//  "binary"    : "binary",
    "bit"       : "boolean",
    "blob"      : "blob",
    "char"      : "string",
    "datetime"  : "datetime",
    "date"      : "date",
    "decimal"   : "decimal",
    "double"    : "float",
    "enum"      : "string",
    "float"     : "float",
    "int"       : "integer",
//  "integer"   : "integer",
    "longblob"  : "blob",
    "longtext"  : "text",
    "mediumblob": "blob",
    "mediumint" : "integer",
    "mediumtext": "text",
//  "numeric"   : "decimal",
//  "real"      : "float",
    "set"       : "simple_array",
    "smallint"  : "smallint",
    "text"      : "text",
    "timestamp" : "datetime",
    "time"      : "time",
    "tinyblob"  : "blob",
    "tinyint"   : "boolean",
    "tinytext"  : "text",
//  "varbinary" : "binary",
    "varchar"   : "string",
    "string"    : "string"
//  "year"      : "date"
  }
};
