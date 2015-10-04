module.exports = MySQLConnection;

var Connection = require('./Connection.js');
var inherits = require('util').inherits;
var MySql = require('mysql');
var Conn = require('mysql/lib/Connection');

/**
 * Class MySQLConnection
 *
 * @param {Object} params
 *
 * @constructor
 */
function MySQLConnection(params) {
  /**
   * @type {Object}
   */
  this.params = params ? params : {};

  /**
   * @type {Conn}
   */
  this.conn = MySql.createConnection(params);
}

inherits(MySQLConnection, Connection);

var p = MySQLConnection.prototype;

/**
 * @returns {Promise}
 */
p.connect = function() {
  var that = this;

  return new Promise(function(resolve, reject) {
    that.conn.connect(function(err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(that.conn.threadId);
    });
  });
};

/**
 * @returns {void}
 */
p.disconnect = function() {
  this.conn.end();
};

/**
 * @param {String} sql
 * @param {Array<string>=} values
 *
 * @returns {Promise} function resolve({Object|Array<Object>} results)
 */
p.query = function(sql, values) {
  if (!values) {
    values = [];
  }

  var that = this;

  return new Promise(function(resolve, reject) {
    that.conn.query(sql, values, function(error, results) {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
};

/**
 * @param {String}         sql
 * @param {Array<String>=} values
 *
 * @returns {Promise} function resolve({Array<Object>} results)
 */
p.fetchAll = function(sql, values) {
  return this.query(sql, values);
};

/**
 * @return {Promise}
 */
p.getDatabase = function() {
  var that = this;

  return new Promise(function(resolve, reject) {
    if (that.params['database']) {
      resolve(that.params['database']);
      return;
    }

    that.conn.query('SELECT DATABASE() AS `database`', function(error, results) {
      if (error) {
        reject(error);
        return;
      }

      var db = results.length > 0 && results[0]['database'] ? results[0]['database'] : null;

      resolve(db);
    });
  });
};
