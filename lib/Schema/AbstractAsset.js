module.exports = AbstractAsset;

var php = require('phpjs');

/**
 * Class AbstractAsset
 *
 * @constructor
 */
function AbstractAsset() {
  /**
   * @type {string}
   *
   * @access protected
   */
  this._name = '';

  /**
   * Namespace of the asset. If none is set, the default namespace is assumed.
   *
   * @type {string}
   *
   * @access protected
   */
  this._namespace = null;

  /**
   * @type {boolean}
   *
   * @access protected
   */
  this._quoted = false;
}

var p = AbstractAsset.prototype;

/**
 * Sets the name of this asset.
 *
 * @param {string} name
 *
 * @returns void
 *
 * @access protected
 */
p._setName = function(name) {
  if (this.isIdentifierQuoted(name)) {
    this._quoted = true;
    name = this.trimQuotes(name);
  }

  if (php.strpos(name, '.') !== false) {
    var parts = name.split('.');

    this._namespace = parts[0];
    name = parts[1];
  }

  this._name = name;
};

/**
 * Is this asset in the default namespace?
 *
 * @param {string} defaultNamespaceName
 *
 * @returns {boolean}
 */
p.isInDefaultNamespace = function(defaultNamespaceName) {
  return this._namespace == defaultNamespaceName || this._namespace === null;
};

/**
 * Gets the namespace name of this asset.
 *
 * If NULL is returned this means the default namespace is used.
 *
 * @returns {string|null}
 */
p.getNamespaceName = function() {
  return this._namespace;
};

/**
 * The shortest name is stripped of the default namespace. All other
 * namespaced elements are returned as full-qualified names.
 *
 * @param {string} defaultNamespaceName
 *
 * @returns {string}
 */
p.getShortestName = function(defaultNamespaceName) {
  var shortestName = this.getName();

  if (this._namespace == defaultNamespaceName) {
    shortestName = this._name;
  }

  return shortestName.toLowerCase();
};

/**
 * The normalized name is full-qualified and lowerspaced. Lowerspacing is
 * actually wrong, but we have to do it to keep our sanity. If you are
 * using database objects that only differentiate in the casing (FOO vs
 * Foo) then you will NOT be able to use Doctrine Schema abstraction.
 *
 * Every non-namespaced element is prefixed with the default namespace
 * name which is passed as argument to this method.
 *
 * @param {string} defaultNamespaceName
 *
 * @returns {string}
 */
p.getFullQualifiedName = function(defaultNamespaceName) {
  var name = this.getName();

  if (!this._namespace) {
    name = defaultNamespaceName + '.' + name;
  }

  return name.toLowerCase();
};

/**
 * Checks if this asset's name is quoted.
 *
 * @returns {boolean}
 */
p.isQuoted = function() {
  return this._quoted;
};

/**
 * Checks if this identifier is quoted.
 *
 * @param {string} identifier
 *
 * @returns {boolean}
 *
 * @access protected
 */
p.isIdentifierQuoted = function(identifier) {
  return (php.is_string(identifier) && identifier.length > 0)
    && (identifier[0] == '`' || identifier[0] == '"' || identifier[0] == '[');
};

/**
 * Trim quotes from the identifier.
 *
 * @param {string} identifier
 *
 * @returns {string}
 *
 * @access protected
 */
p.trimQuotes = function(identifier) {
  return php.str_replace(['`', '"', '[', ']'], '', identifier);
};

/**
 * Returns the name of this schema asset.
 *
 * @returns {string}
 */
p.getName = function() {
  if (this._namespace) {
    return this._namespace + "." + this._name;
  }

  return this._name;
};

/**
 * Gets the quoted representation of this asset but only if it was defined with one. Otherwise
 * return the plain unquoted value as inserted.
 *
 * @param {AbstractPlatform} platform
 *
 * @return {string}
 */
p.getQuotedName = function(platform) {
  var keywords = platform.getReservedKeywordsList();
  var parts = this.getName().split('.');

  parts.forEach(function(part, index) {
    parts[index] = (this._quoted || keywords.isKeyword(part)) ? platform.quoteIdentifier(part) : part;
  }.bind(this));

  return parts.join('.');
};

/**
 * Generates an identifier from a list of column names obeying a certain string length.
 *
 * This is especially important for Oracle, since it does not allow identifiers larger than 30 chars,
 * however building idents automatically for foreign keys, composite keys or such can easily create
 * very long names.
 *
 * @param {Array}  columnNames
 * @param {string} prefix
 * @param {int}    maxSize
 *
 * @return {string}
 *
 * @access protected
 */
p._generateIdentifierName = function(columnNames, prefix, maxSize) {
  var hash = columnNames.map(function (columnName) {
    return php.dechex(php.crc32(columnName));
  }).join('');

  return (prefix + '_' + hash).toUpperCase().substr(0, maxSize);
};
