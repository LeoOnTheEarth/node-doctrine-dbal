module.exports = UnitTest;

/**
 * Class UnitTest
 *
 * @constructor
 */
function UnitTest() {}

var p = UnitTest.prototype;

/**
 * Get test case name
 *
 * @returns {string}
 */
p.getName = function() {
  return this.constructor.name;
};

/**
 * This method will run before running every test case.
 *
 * @returns {void}
 */
p.setUp = function() {};

/**
 * This method will run after running every test case.
 *
 * @returns {void}
 */
p.tearDown = function() {};

/**
 * This method will run before running all test case.
 *
 * @returns {void}
 */
p.setUpBeforeClass = function() {};

/**
 * This method will run after running all test case.
 *
 * @returns {void}
 */
p.tearDownAfterClass = function() {};

/**
 * Run all tests in the UnitTest class
 *
 * @returns {void}
 */
p.run = function() {
  this.setUpBeforeClass();

  describe(this.getName(), function() {
    for (var methodName in this) {
      if (0 === methodName.indexOf('test')) {
        describe(methodName, function() {
          this.setUp();
          this[methodName]();
          this.tearDown();
        }.bind(this));
      }
    }
  }.bind(this));

  this.tearDownAfterClass();
};
