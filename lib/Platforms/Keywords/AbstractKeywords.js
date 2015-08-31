module.exports = AbstractKeywords;

function AbstractKeywords() {}

/**
 * Class AbstractKeywords
 *
 * @constructor
 */
var p = AbstractKeywords.prototype;

/**
 * @type {Object<string, int>}
 *
 * @access private
 */
var keywords = null;

/**
 * Checks if the given word is a keyword of this dialect/vendor platform.
 *
 * @param {string} word
 *
 * @returns {boolean}
 */
p.isKeyword = function(word) {
  if (!keywords) {
      this.initializeKeywords();
  }

  return keywords.hasOwnProperty(word.toUpperCase());
};

/**
 * @returns {void}
 *
 * @access protected
 */
p.initializeKeywords = function() {
  keywords = {};

  this.getKeywords().forEach(function(keyword, index) {
    keywords[keyword.toUpperCase()] = index;
  });
};

/**
 * Returns the list of keywords.
 *
 * @return {Array<string>}
 *
 * @abstract
 * @access protected
 */
p.getKeywords = function() {
  return [];
};

/**
 * Returns the name of this keyword list.
 *
 * @return string
 *
 * @abstract
 * @public
 */
p.getName = function() {
  return '';
};
