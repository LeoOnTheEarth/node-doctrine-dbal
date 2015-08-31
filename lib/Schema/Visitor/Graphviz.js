module.exports = Graphviz;

var AbstractVisitor = require('./AbstractVisitor.js');
var Table = require('../Table.js');
var ForeignKeyConstraint = require('../ForeignKeyConstraint.js');
var php = require('phpjs');
var each = require('../../util.js').forEach;
var inherits = require('util').inherits;
var validArg = require('../../util.js').validArg;
var fs = require('fs');

/**
 * Class Graphviz
 *
 * Create a Graphviz output of a Schema.
 *
 * @constructor
 */
function Graphviz() {
  /**
   * @type {string}
   *
   * @access private
   */
  this.output = '';
}

inherits(Graphviz, AbstractVisitor);

var p = Graphviz.prototype;

/**
 * @param {Schema} schema
 */
p.acceptSchema = function(schema) {
  this.output  = 'digraph "' + php.sha1(php.mt_rand()) + '" {' + "\n";
  this.output += 'splines = true;' + "\n";
  this.output += 'overlap = false;' + "\n";
  this.output += 'outputorder=edgesfirst;' + "\n";
  this.output += 'mindist = 0.6;' + "\n";
  this.output += 'sep = .2;' + "\n";
};

/**
 * @param {Table} table
 */
p.acceptTable = function(table) {
  validArg(table, 'table', Table);

  this.output += this.createNode(
    table.getName(),
    {
      "label": this.createTableLabel(table),
      "shape": 'plaintext'
    }
  );
};

/**
 * @param {Table}                localTable
 * @param {ForeignKeyConstraint} fkConstraint
 */
p.acceptForeignKey = function(localTable, fkConstraint) {
  validArg(localTable, 'localTable', Table);
  validArg(fkConstraint, 'fkConstraint', ForeignKeyConstraint);

  this.output += this.createNodeRelation(
    fkConstraint.getLocalTableName() + ":col" + php.current(fkConstraint.getLocalColumns()) + ":se",
    fkConstraint.getForeignTableName() + ":col" + php.current(fkConstraint.getForeignColumns()) + ":se",
    {
      "dir":       'back',
      "arrowtail": 'dot',
      "arrowhead": 'normal'
    }
  );
};

/**
 * @param {Table} table
 *
 * @returns {string}
 *
 * @access private
 */
p.createTableLabel = function(table) {
  validArg(table, 'table', Table);

  // Start the table
  var label = '<<TABLE CELLSPACING="0" BORDER="1" ALIGN="LEFT">';

  // The title
  label += '<TR><TD BORDER="1" COLSPAN="3" ALIGN="CENTER" BGCOLOR="#fcaf3e"><FONT COLOR="#2e3436" FACE="Helvetica" POINT-SIZE="12">' + table.getName() + '</FONT></TD></TR>';

  // The attributes block
  each(table.getColumns(), function(column) {
    var columnLabel = column.getName();

    label += '<TR>';
    label += '<TD BORDER="0" ALIGN="LEFT" BGCOLOR="#eeeeec">';
    label += '<FONT COLOR="#2e3436" FACE="Helvetica" POINT-SIZE="12">' + columnLabel + '</FONT>';
    label += '</TD><TD BORDER="0" ALIGN="LEFT" BGCOLOR="#eeeeec"><FONT COLOR="#2e3436" FACE="Helvetica" POINT-SIZE="10">' + column.getType().toString().toLowerCase() + '</FONT></TD>';
    label += '<TD BORDER="0" ALIGN="RIGHT" BGCOLOR="#eeeeec" PORT="col' + column.getName() + '">';

    if (table.hasPrimaryKey() && table.getPrimaryKey().getColumns().indexOf(column.getName()) > -1) {
      label += "\xe2\x9c\xb7";
    }

    label += '</TD></TR>';
  });

  // End the table
  label += '</TABLE>>';

  return label;
};

/**
 * @param {string}            name
 * @param {Object<string, *>} options
 *
 * @returns {string}
 *
 * @access private
 */
p.createNode = function(name, options) {
  var node = name + ' [';

  each(options, function(value, key) {
    node += key + '=' + value + ' ';
  });

  node += "]\n";

  return node;
};

/**
 * @param {string}            node1
 * @param {string}            node2
 * @param {Object<string, *>} options
 *
 * @returns {string}
 *
 * @access private
 */
p.createNodeRelation = function(node1, node2, options) {
  var relation = node1 + ' -> ' + node2 + ' [';

  each(options, function(value, key) {
    relation += key + '=' + value + ' ';
  });

  relation += "]\n";

  return relation;
};

/**
 * Get Graphviz Output
 *
 * @returns {string}
 */
p.getOutput = function() {
  return this.output + '}';
};

/**
 * Writes dot language output to a file. This should usually be a *.dot file.
 *
 * You have to convert the output into a viewable format. For example use "neato" on linux systems
 * and execute:
 *
 *  neato -Tpng -o er.png er.dot
 *
 * @param {string} filename
 *
 * @returns {void}
 */
p.write = function(filename) {
  fs.writeFileSync(filename, this.getOutput());
};
