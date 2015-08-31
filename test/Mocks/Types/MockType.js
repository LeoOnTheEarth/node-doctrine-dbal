module.exports = MockType;

var AbstractType = require('../../../lib/Types/AbstractType.js');
var inherits = require('util').inherits;

/**
 * Class MockType
 *
 * @param {string} typeName
 *
 * @constructor
 */
function MockType(typeName) {
  /**
   * @type {string}
   */
  this.typeName = typeName;
}

inherits(MockType, AbstractType);

var p = MockType.prototype;

/**
 * @returns {string}
 */
p.getName = function() {
  return this.typeName;
};

/**
 * @param {string} typeName
 * @returns {}
 */
MockType.getType = function(typeName) {
  return new MockType(typeName);
};

/**
 * @returns {Object<string, string>}
 */
p.getDoctrineTypeMapping = function() {
  return {
    "array"       : "array",
    "simple_array": "simplearray",
    "json_array"  : "jsonarray",
    "object"      : "object",
    "boolean"     : "boolean",
    "integer"     : "integer",
    "smallint"    : "smallint",
    "bigint"      : "bigint",
    "string"      : "string",
    "text"        : "text",
    "datetime"    : "datetime",
    "datetimetz"  : "datetimetz",
    "date"        : "date",
    "time"        : "time",
    "decimal"     : "decimal",
    "float"       : "float",
    "binary"      : "binary",
    "blob"        : "blob",
    "guid"        : "guid",
    "dateinterval": "dateinterval"
  };
};
