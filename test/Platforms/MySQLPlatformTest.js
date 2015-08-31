var AbstractMySQLPlatformTestCase = require('./AbstractMySQLPlatformTestCase.js');
var MySQLPlatform = require('../../lib/Platforms/MySQLPlatform.js');
var inherits = require('util').inherits;

/**
 * Class MySQLPlatformTest
 *
 * @constructor
 */
function MySQLPlatformTest()
{
  MySQLPlatformTest.super_.call(this);
}

inherits(MySQLPlatformTest, AbstractMySQLPlatformTestCase);

var p = MySQLPlatformTest.prototype;

p.getName = function() {
  return 'Platform/MySQLPlatform';
};

p.createPlatform = function() {
  return new MySQLPlatform();
};

(new MySQLPlatformTest()).run();
