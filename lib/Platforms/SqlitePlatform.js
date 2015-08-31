module.exports = SqlitePlatform;

var AbstractPlatform = require('./AbstractPlatform.js');
var inherits = require('util').inherits;

function SqlitePlatform() {}

inherits(SqlitePlatform, AbstractPlatform);

var p = SqlitePlatform.prototype;
