module.exports = Table;

var AbstractAsset = require('./AbstractAsset.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var AbstractType = require('../Types/AbstractType.js');
var Column = require('./Column.js');
var Index = require('./Index.js');
var ForeignKeyConstraint = require('./ForeignKeyConstraint.js');
var SchemaConfig = require('./SchemaConfig.js');
var DBALException = require('../Exception/DBALException.js');
var SchemaException = require('../Exception/SchemaException.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');
var php = require('phpjs');
var inherits = require('util').inherits;
var validArg = require('../util.js').validArg;
var each = require('../util.js').forEach;

/**
 * Class Table
 * @param {string}                       tableName
 * @param {Object<string, Column>=}      columns
 * @param {Object<string, Index>=}       indexes
 * @param {Array<ForeignKeyConstraint>=} fkConstraints
 * @param {int=}                         idGeneratorType
 * @param {Object<string, *>=}           options
 *
 * @constructor
 */
function Table(tableName, columns, indexes, fkConstraints, idGeneratorType, options) {
  Table.super_.call(this);

  tableName = tableName ? tableName : '';
  columns = columns ? columns : {};
  indexes = indexes ? indexes : {};
  fkConstraints = fkConstraints ? fkConstraints : [];
  idGeneratorType = idGeneratorType ? php.intval(idGeneratorType) : 0;
  options = options ? options : {};

  if (tableName.length === 0) {
    throw DBALException.invalidTableName(tableName);
  }

  validArg(columns, 'columns', 'Object');
  validArg(indexes, 'indexes', 'Object');
  validArg(fkConstraints, 'fkConstraints', 'Array');
  validArg(options, 'options', 'Object');

	/**
	 * @type {Object.<string, Column>}
   *
   * @access protected
	 */
	this._columns = {};

  /**
   * @type {Object.<string, Index>}
   *
   * @access private
   */
  this.implicitIndexes = {};

  /**
   * @type {Object.<string, Index>}
   *
   * @access protected
   */
  this._indexes = {};

  /**
   * @type {string|boolean}
   *
   * @access protected
   */
  this._primaryKeyName = false;

  /**
   * @type {Object.<string, ForeignKeyConstraint>}
   *
   * @access protected
   */
  this._fkConstraints = {};

  /**
   * @type {Object.<string, *>}
   *
   * @access protected
   */
  this._options = {};

  /**
   * @type {SchemaConfig}
   *
   * @access protected
   */
  this._schemaConfig = null;

  this._setName(tableName);

  each(columns, function(column) {
    this._addColumn(column);
  }.bind(this));

  each(indexes, function(index) {
    this._addIndex(index);
  }.bind(this));

  fkConstraints.forEach(function(constraint) {
    this._addForeignKeyConstraint(constraint);
  }.bind(this));

  this._options = options;
}

inherits(Table, AbstractAsset);

var p = Table.prototype;

/**
 * @param {SchemaConfig} schemaConfig
 *
 * @returns {void}
 */
p.setSchemaConfig = function(schemaConfig) {
  if (! (schemaConfig instanceof SchemaConfig)) {
    throw new InvalidArgumentException(schemaConfig, 'schemaConfig', 'SchemaConfig');
  }

  this._schemaConfig = schemaConfig;
};

/**
 * @returns {int}
 *
 * @access protected
 */
p._getMaxIdentifierLength = function() {
  if (this._schemaConfig instanceof SchemaConfig) {
    return this._schemaConfig.getMaxIdentifierLength();
  }

  return 63;
};

/**
 * Sets the Primary Key.
 *
 * @param {Array<string>} columns
 * @param {string|boolean=}   indexName
 *
 * @returns {Table}
 */
p.setPrimaryKey = function(columns, indexName) {
  if (!Array.isArray(columns)) {
    throw new InvalidArgumentException(columns, 'columns', 'Array');
  }

  indexName = php.isset(indexName) ? indexName : false;
  indexName = indexName ? indexName : 'primary';

  this._addIndex(this._createIndex(columns, indexName, true, true));

  columns.forEach(function(columnName) {
    var column = this.getColumn(columnName);

    if (column instanceof Column) {
      column.setNotnull(true);
    }
  }.bind(this));

  return this;
};

/**
 * @param {Array<string>}      columnNames
 * @param {string=}            indexName
 * @param {Array<string>=}     flags
 * @param {Object<string, *>=} options
 *
 * @returns {Table}
 */
p.addIndex = function(columnNames, indexName, flags, options) {
  indexName = indexName ? indexName : null;
  flags = flags ? flags : [];
  options = options ? options : {};

  if (!Array.isArray(columnNames)) {
    throw new InvalidArgumentException(columnNames, 'columnNames', 'Array');
  }

  if (!Array.isArray(flags)) {
    throw new InvalidArgumentException(flags, 'flags', 'Array');
  }

  if (!(options instanceof Object)) {
    throw new InvalidArgumentException(options, 'options', 'Object');
  }

  if (null === indexName) {
    indexName = this._generateIdentifierName(
      php.array_merge([this.getName()], columnNames),
      'idx',
      this._getMaxIdentifierLength()
    );
  }

  return this._addIndex(this._createIndex(columnNames, indexName, false, false, flags, options));
};

/**
 * Drops the primary key from this table.
 *
 * @returns {void}
 */
p.dropPrimaryKey = function() {
  this.dropIndex(this._primaryKeyName);

  this._primaryKeyName = false;
};

/**
 * Drops an index from this table.
 *
 * @param {string} indexName The index name.
 *
 * @returns {void}
 *
 * @throws {SchemaException} If the index does not exist.
 */
p.dropIndex = function(indexName) {
  indexName = this.normalizeIdentifier(indexName);

  if (!this.hasIndex(indexName)) {
    throw SchemaException.indexDoesNotExist(indexName, this._name);
  }

  delete this._indexes[indexName];
};

/**
 * @param {Array<string>}      columnNames
 * @param {string=}            indexName
 * @param {Object<string, *>=} options
 *
 * @returns {Table}
 */
p.addUniqueIndex = function(columnNames, indexName, options) {
  if (!Array.isArray(columnNames)) {
    throw new InvalidArgumentException(columnNames, 'columnNames', 'Array');
  }

  indexName = indexName ? indexName : null;
  options = options ? options : {};

  if (!(options instanceof Object)) {
    throw new InvalidArgumentException(options, 'options', 'Object');
  }

  if (indexName === null) {
    indexName = this._generateIdentifierName(
      php.array_merge([this.getName()], columnNames),
      'uniq',
      this._getMaxIdentifierLength()
    );
  }

  return this._addIndex(this._createIndex(columnNames, indexName, true, false, [], options));
};

/**
 * Renames an index.
 *
 * @param {string}  oldIndexName The name of the index to rename from.
 * @param {string=} newIndexName The name of the index to rename to.
 *                               If null is given, the index name will be auto-generated.
 *
 * @returns {Table} This table instance.
 *
 * @throws SchemaException If no index exists for the given current name
 *                         or if an index with the given new name already exists on this table.
 */
p.renameIndex = function(oldIndexName, newIndexName) {
  newIndexName = newIndexName ? newIndexName : '';
  oldIndexName = this.normalizeIdentifier(oldIndexName);

  var normalizedNewIndexName = this.normalizeIdentifier(newIndexName);

  if (oldIndexName === normalizedNewIndexName) {
    return this;
  }

  if (!this.hasIndex(oldIndexName)) {
    throw SchemaException.indexDoesNotExist(oldIndexName, this._name);
  }

  if (this.hasIndex(normalizedNewIndexName)) {
    throw SchemaException.indexAlreadyExists(normalizedNewIndexName, this._name);
  }

  var oldIndex = this._indexes[oldIndexName];

  if (oldIndex.isPrimary()) {
    this.dropPrimaryKey();

    return this.setPrimaryKey(oldIndex.getColumns(), newIndexName);
  }

  delete this._indexes[oldIndexName];

  if (oldIndex.isUnique()) {
    return this.addUniqueIndex(oldIndex.getColumns(), newIndexName);
  }

  return this.addIndex(oldIndex.getColumns(), newIndexName, oldIndex.getFlags());
};

/**
 * Checks if an index begins in the order of the given columns.
 *
 * @param {Array} columnNames
 *
 * @returns {boolean}
 */
p.columnsAreIndexed = function(columnNames) {
  if (!Array.isArray(columnNames)) {
    throw new InvalidArgumentException(columnNames, 'columnNames', 'Array');
  }

  var indexes = this.getIndexes();
  var indexNames = Object.keys(indexes);
  var max = indexNames.length;

  for (var i = 0; i < max; ++i) {
    var index = indexes[indexNames[i]];

    if (index.spansColumns(columnNames)) {
      return true;
    }
  }

  return false;
};

/**
 * @param {Array<string>}      columnNames
 * @param {string}             indexName
 * @param {boolean}            isUnique
 * @param {boolean}            isPrimary
 * @param {Array<string>=}     flags
 * @param {Object<string, *>=} options
 *
 * @returns {Index}
 *
 * @throws {SchemaException}
 *
 * @access private
 */
p._createIndex = function(columnNames, indexName, isUnique, isPrimary, flags, options) {
  flags = flags ? flags : [];
  options = options ? options : {};

  if (!Array.isArray(columnNames)) {
    throw new InvalidArgumentException(columnNames, 'columnNames', 'Array');
  }

  if (typeof indexName !== 'string') {
    throw new InvalidArgumentException(indexName, 'indexName', 'String');
  }

  if (typeof isUnique !== 'boolean') {
    throw new InvalidArgumentException(isUnique, 'isUnique', 'Boolean');
  }

  if (typeof isPrimary !== 'boolean') {
    throw new InvalidArgumentException(isPrimary, 'isPrimary', 'Boolean');
  }

  if (!Array.isArray(flags)) {
    throw new InvalidArgumentException(flags, 'flags', 'Array');
  }

  if (!(options instanceof Object)) {
    throw new InvalidArgumentException(options, 'options', 'Object');
  }

  if (this.normalizeIdentifier(indexName).match(/([^a-zA-Z0-9_]+)/)) {
    throw SchemaException.indexNameInvalid(indexName);
  }

  columnNames.forEach(function(columnName) {
    if (!this.hasColumn(columnName)) {
      throw SchemaException.columnDoesNotExist(columnName, this._name);
    }
  }.bind(this));

  return new Index(indexName, columnNames, isUnique, isPrimary, flags, options);
};

/**
 * Check if this table has a column with the given name
 *
 * @param {string}             columnName
 * @param {AbstractType}       type
 * @param {Object<string, *>=} options
 *
 * @returns {Column}
 */
p.addColumn = function(columnName, type, options) {
  options = options ? options : {};

  if (!(type instanceof AbstractType)) {
    throw new InvalidArgumentException(type, 'type', 'AbstractType');
  }

  if (!(options instanceof Object)) {
    throw new InvalidArgumentException(options, 'options', 'Object');
  }

  var column = new Column(columnName, type, options);

  this._addColumn(column);

  return column;
};

/**
 * Change Column Details.
 *
 * @param {string}            columnName
 * @param {Object<string, *>} options
 *
 * @returns {Table}
 */
p.changeColumn = function(columnName, options) {
  if (!(options instanceof Object)) {
    throw new InvalidArgumentException(options, 'options', 'Object');
  }

  var column = this.getColumn(columnName);

  column.setOptions(options);

  return this;
};

/**
 * Drops a Column from the Table.
 *
 * @param {string} columnName
 *
 * @returns {Table}
 */
p.dropColumn = function(columnName) {
  columnName = this.normalizeIdentifier(columnName);

  delete this._columns[columnName];

  return this;
};

/**
 * Adds a foreign key constraint.
 *
 * Name is inferred from the local columns.
 *
 * @param {Table|string}       foreignTable        Table schema instance or table name
 * @param {Array<string>}      localColumnNames
 * @param {Array<string>}      foreignColumnNames
 * @param {Object<string, *>=} options
 * @param {string=}            constraintName
 *
 * @returns {Table}
 */
p.addForeignKeyConstraint = function(foreignTable, localColumnNames, foreignColumnNames, options, constraintName) {
  options = options ? options : {};

  validArg(localColumnNames, 'localColumnNames', 'Array');
  validArg(foreignColumnNames, 'foreignColumnNames', 'Array');
  validArg(options, 'options', 'Object');

  constraintName = constraintName
    ? constraintName
    : this._generateIdentifierName(
      php.array_merge([this.getName()], localColumnNames),
      'fk',
      this._getMaxIdentifierLength()
    );

  return this.addNamedForeignKeyConstraint(
    constraintName,
    foreignTable,
    localColumnNames,
    foreignColumnNames,
    options
  );
};

/**
 * Adds a foreign key constraint.
 *
 * Name is to be generated by the database itself.
 *
 * @deprecated Use {@link addForeignKeyConstraint}
 *
 * @param {Table|string}       foreignTable        Table schema instance or table name
 * @param {Array<string>}      localColumnNames
 * @param {Array<string>}      foreignColumnNames
 * @param {Object<string, *>=} options
 *
 * @returns {Table}
 */
p.addUnnamedForeignKeyConstraint = function(foreignTable, localColumnNames, foreignColumnNames, options) {
  return this.addForeignKeyConstraint(foreignTable, localColumnNames, foreignColumnNames, options);
};

/**
 * Adds a foreign key constraint with a given name.
 *
 * @deprecated Use {@link addForeignKeyConstraint}
 *
 * @param {string}             name
 * @param {Table|string}       foreignTable Table schema instance or table name
 * @param {Array<string>}      localColumnNames
 * @param {Array<string>}      foreignColumnNames
 * @param {Object<string, *>=} options
 *
 * @returns {Table}
 *
 * @throws {SchemaException}
 */
p.addNamedForeignKeyConstraint = function(name, foreignTable, localColumnNames, foreignColumnNames, options) {
  options = options ? options : {};

  validArg(localColumnNames, 'localColumnNames', 'Array');
  validArg(foreignColumnNames, 'foreignColumnNames', 'Array');
  validArg(options, 'options', 'Object');

  if (foreignTable instanceof Table) {
    foreignColumnNames.forEach(function(columnName) {
      if (!foreignTable.hasColumn(columnName)) {
        throw SchemaException.columnDoesNotExist(columnName, foreignTable.getName());
      }
    });
  }

  localColumnNames.forEach(function(columnName) {
    if (!this.hasColumn(columnName)) {
      throw SchemaException.columnDoesNotExist(columnName, this._name);
    }
  }.bind(this));

  var constraint = new ForeignKeyConstraint(localColumnNames, foreignTable, foreignColumnNames, name, options);

  this._addForeignKeyConstraint(constraint);

  return this;
};

/**
 * @param {string} name
 * @param {*}      value
 *
 * @returns {Table}
 */
p.addOption = function(name, value) {
  this._options[name] = value;

  return this;
};

/**
 * @param {Column} column
 *
 * @returns {void}
 *
 * @throws {SchemaException}
 */
p._addColumn = function(column) {
  validArg(column, 'column', Column);

  var columnName = column.getName();

  columnName = this.normalizeIdentifier(columnName);

  if (php.isset(this._columns[columnName])) {
    throw SchemaException.columnAlreadyExists(this.getName(), columnName);
  }

  this._columns[columnName] = column;
};

/**
 * Adds an index to the table.
 *
 * @param {Index} indexCandidate
 *
 * @returns {Table}
 *
 * @throws {SchemaException}
 *
 * @access protected
 */
p._addIndex = function(indexCandidate) {
  validArg(indexCandidate, 'indexCandidate', Index);

  var indexName = indexCandidate.getName();
  var replacedImplicitIndexes = [];

  indexName = this.normalizeIdentifier(indexName);

  Object.keys(this.implicitIndexes).forEach(function(name) {
    var implicitIndex = this.implicitIndexes[name];

    if (implicitIndex.isFullfilledBy(indexCandidate) && php.isset(this._indexes[name])) {
      replacedImplicitIndexes.push(name);
    }
  }.bind(this));

  if ((php.isset(this._indexes[indexName]) && replacedImplicitIndexes.indexOf(indexName) === -1) ||
    (this._primaryKeyName !== false && indexCandidate.isPrimary())) {
    throw SchemaException.indexAlreadyExists(indexName, this._name);
  }

  replacedImplicitIndexes.forEach(function(name) {
    delete this._indexes[name];
    delete this.implicitIndexes[name];
  }.bind(this));

  if (indexCandidate.isPrimary()) {
    this._primaryKeyName = indexName;
  }

  this._indexes[indexName] = indexCandidate;

  return this;
};

/**
 * @param {ForeignKeyConstraint} constraint
 *
 * @returns {void}
 */
p._addForeignKeyConstraint = function(constraint) {
  validArg(constraint, 'constraint', ForeignKeyConstraint);

  var name;

  constraint.setLocalTable(this);

  if (constraint.getName().length) {
    name = constraint.getName();
  } else {
    name = this._generateIdentifierName(
      php.array_merge([this.getName()], constraint.getLocalColumns()),
      'fk',
      this._getMaxIdentifierLength()
    );
  }

  name = this.normalizeIdentifier(name);

  this._fkConstraints[name] = constraint;

  // add an explicit index on the foreign key columns. If there is already an index that fulfils this requirements drop the request.
  // In the case of __construct calling this method during hydration from schema-details all the explicitly added indexes
  // lead to duplicates. This creates computation overhead in this case, however no duplicate indexes are ever added (based on columns).
  var indexName = this._generateIdentifierName(
    php.array_merge([this.getName()], constraint.getColumns()),
    'idx',
    this._getMaxIdentifierLength()
  );

  var indexCandidate = this._createIndex(constraint.getColumns(), indexName, false, false);
  var indexNames = Object.keys(this._indexes);
  var max = indexNames.length;

  for (var i = 0; i < max; ++i) {
    var existingIndex = this._indexes[indexNames[i]];

    if (indexCandidate.isFullfilledBy(existingIndex)) {
      return;
    }
  }

  this._addIndex(indexCandidate);

  this.implicitIndexes[this.normalizeIdentifier(indexName)] = indexCandidate;
};

/**
 * Returns whether this table has a foreign key constraint with the given name.
 *
 * @param {string} constraintName
 *
 * @returns {boolean}
 */
p.hasForeignKey = function(constraintName) {
  constraintName = this.normalizeIdentifier(constraintName);

  return php.isset(this._fkConstraints[constraintName]);
};

/**
 * Returns the foreign key constraint with the given name.
 *
 * @param {string} constraintName The constraint name.
 *
 * @returns {ForeignKeyConstraint}
 *
 * @throws {SchemaException} If the foreign key does not exist.
 */
p.getForeignKey = function(constraintName) {
  constraintName = this.normalizeIdentifier(constraintName);

  if (!this.hasForeignKey(constraintName)) {
    throw SchemaException.foreignKeyDoesNotExist(constraintName, this._name);
  }

  return this._fkConstraints[constraintName];
};

/**
 * Removes the foreign key constraint with the given name.
 *
 * @param {string} constraintName The constraint name.
 *
 * @returns {void}
 *
 * @throws {SchemaException}
 */
p.removeForeignKey = function(constraintName) {
  constraintName = this.normalizeIdentifier(constraintName);

  if (!this.hasForeignKey(constraintName)) {
    throw SchemaException.foreignKeyDoesNotExist(constraintName, this._name);
  }

  delete this._fkConstraints[constraintName];
};

/**
 * @returns {Object<string, Column>}
 */
p.getColumns = function() {
  var columns = this._columns;

  var pkCols = [];
  var fkCols = [];
  var fks = this.getForeignKeys();

  if (this.hasPrimaryKey()) {
    pkCols = this.getPrimaryKey().getColumns();
  }

  Object.keys(fks).forEach(function(key) {
    var fk = fks[key];

    fkCols = php.array_merge(fkCols, fk.getColumns());
  });

  var colNames = php.array_values(php.array_unique(php.array_merge(pkCols, fkCols, Object.keys(columns))));

  php.uksort(columns, function(a, b) {
    return (php.array_search(a, colNames) >= php.array_search(b, colNames));
  });

  return columns;
};

/**
 * Returns whether this table has a Column with the given name.
 *
 * @param {string} columnName The column name
 *
 * @returns {boolean}
 */
p.hasColumn = function(columnName) {
  columnName = this.normalizeIdentifier(columnName);

  return php.isset(this._columns[columnName]);
};

/**
 * Returns the Column with the given name.
 *
 * @param {string} columnName The column name.
 *
 * @returns {Column}
 *
 * @throws {SchemaException} If the column does not exist.
 */
p.getColumn = function(columnName) {
  columnName = this.normalizeIdentifier(columnName);

  if (!this.hasColumn(columnName)) {
    throw SchemaException.columnDoesNotExist(columnName, this._name);
  }

  return this._columns[columnName];
};

/**
 * Returns the primary key.
 *
 * @returns {Index|null} The primary key, or null if this Table has no primary key.
 */
p.getPrimaryKey = function() {
  if (!this.hasPrimaryKey()) {
    return null;
  }

  return this.getIndex(this._primaryKeyName);
};

/**
 * Returns the primary key columns.
 *
 * @returns {Array<string>}
 *
 * @throws DBALException
 */
p.getPrimaryKeyColumns = function() {
  if (!this.hasPrimaryKey()) {
    throw new DBALException('Table ' + this.getName() + ' has no primary key.');
  }

  return this.getPrimaryKey().getColumns();
};


/**
 * Returns whether this table has a primary key.
 *
 * @returns {boolean}
 */
p.hasPrimaryKey = function() {
  return (this._primaryKeyName && this.hasIndex(this._primaryKeyName));
};

/**
 * Returns whether this table has an Index with the given name.
 *
 * @param {string} indexName The index name.
 *
 * @returns {boolean}
 */
p.hasIndex = function(indexName) {
  indexName = this.normalizeIdentifier(indexName);

  return (php.isset(this._indexes[indexName]));
};

/**
 * Returns the Index with the given name.
 *
 * @param {string} indexName The index name.
 *
 * @returns {Index}
 *
 * @throws SchemaException If the index does not exist.
 */
p.getIndex = function(indexName) {
  indexName = this.normalizeIdentifier(indexName);

  if (!this.hasIndex(indexName)) {
    throw SchemaException.indexDoesNotExist(indexName, this._name);
  }

  return this._indexes[indexName];
};

/**
 * @returns {Object<string, Index>}
 */
p.getIndexes = function() {
  return this._indexes;
};

/**
 * Returns the foreign key constraints.
 *
 * @returns {Object<string, ForeignKeyConstraint>}
 */
p.getForeignKeys = function() {
  return this._fkConstraints;
};

/**
 * @param {string} name
 *
 * @returns {boolean}
 */
p.hasOption = function(name) {
  return php.isset(this._options[name]);
};

/**
 * @param {string} name
 *
 * @return {*}
 */
p.getOption = function(name) {
  return this._options[name];
};

/**
 * @return {Object<string, *>}
 */
p.getOptions = function() {
  return this._options;
};

/**
 * @param {AbstractVisitor} visitor
 *
 * @return void
 */
p.visit = function(visitor) {
  var columns = this.getColumns();
  var indexes = this.getIndexes();
  var foreignKeys = this.getForeignKeys();

  visitor.acceptTable(this);

  Object.keys(columns).forEach(function(key) {
    var column = columns[key];

    visitor.acceptColumn(this, column);
  }.bind(this));

  Object.keys(indexes).forEach(function(key) {
    var index = indexes[key];

    visitor.acceptIndex(this, index);
  }.bind(this));

  Object.keys(foreignKeys).forEach(function(key) {
    var constraint = foreignKeys[key];

    visitor.acceptForeignKey(this, constraint);
  }.bind(this));
};

/**
 * Normalizes a given identifier.
 *
 * Trims quotes and lowercases the given identifier.
 *
 * @param {string} identifier The identifier to normalize.
 *
 * @returns {string} The normalized identifier.
 *
 * @access private
 */
p.normalizeIdentifier = function(identifier) {
  return this.trimQuotes(identifier.toLowerCase());
};
