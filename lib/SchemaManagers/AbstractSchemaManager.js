module.exports = AbstractSchemaManager;

var Connection = require('../Connections/Connection.js');
var AbstractPlatform = require('../Platforms/AbstractPlatform.js');
var Schema = require('../Schema/Schema.js');
var SchemaConfig = require('../Schema/SchemaConfig.js');
var Column = require('../Schema/Column.js');
var Table = require('../Schema/Table.js');
var Index = require('../Schema/Index.js');
var View = require('../Schema/View.js');
var Constraint = require('../Schema/Constraint.js');
var TableDiff = require('../Schema/TableDiff.js');
var MethodNotImplementException = require('../Exception/MethodNotImplementException.js');
var DBALException = require('../Exception/DBALException.js');
var php = require('phpjs');
var validArg = require('../util.js').validArg;
var each = require('../util.js').forEach;

/**
 * Class AbstractSchemaManager
 *
 * @param {Connection}       conn
 * @param {AbstractPlatform} platform
 *
 * @constructor
 */
function AbstractSchemaManager(conn, platform) {
  validArg(conn, 'conn', Connection);
  validArg(platform, 'platform', AbstractPlatform);

  /**
   * @type {Connection}
   *
   * @access protected
   */
  this._conn = conn;

  /**
   * @type {AbstractPlatform}
   *
   * @access protected
   */
  this._platform = platform;
}

p = AbstractSchemaManager.prototype;

/**
 * @returns {AbstractPlatform}
 */
p.getDatabasePlatform = function() {
  return this._platform;
};

/**
 * Lists the available databases for this connection.
 *
 * @returns {Promise} function resolve({Array<*>} databases)
 */
p.listDatabases = function() {
  var sql = this._platform.getListDatabasesSQL();

  return this._conn.fetchAll(sql).then(function(databases) {
    return this._getPortableDatabasesList(databases);
  }.bind(this));
};

/**
 * Returns a list of all namespaces in the current database.
 *
 * @returns {Promise} function resolve({Array<*>} namespaces)
 */
p.listNamespaceNames = function() {
  var sql = this._platform.getListNamespacesSQL();

  return this._conn.fetchAll(sql).then(function(namespaces) {
    return this.getPortableNamespacesList(namespaces);
  }.bind(this));
};

/**
 * Lists the available sequences for this connection.
 *
 * @param {String|null=} database
 *
 * @returns {Promise} function resolve({Sequence[]} sequences)
 */
p.listSequences = function(database) {
  database = database ? database : null;

  var that = this;
  var listSequences = function(database) {
    var sql = that._platform.getListSequencesSQL(database);

    return that._conn.fetchAll(sql).then(function(sequences) {
      return that._getPortableSequencesList(sequences);
    });
  };

  if (database) {
    return listSequences(database);
  }

  return this._conn.getDatabase().then(function(database) {
    return listSequences(database);
  });
};

/**
 * Lists the columns for a given table.
 *
 * In contrast to other libraries and to the old version of Doctrine,
 * this column definition does try to contain the 'primary' field for
 * the reason that it is not portable across different RDBMS. Use
 * {@see listTableIndexes(tableName)} to retrieve the primary key
 * of a table. We're a RDBMS specifies more details these are held
 * in the platformDetails array.
 *
 * @param {String}  table    The name of the table.
 * @param {String=} database
 *
 * @return {Promise} function resolve({Column[]} columns)
 */
p.listTableColumns = function(table, database) {
  database = database ? database : null;

  var that = this;
  var listTableColumns = function(table, database) {
    var sql = that._platform.getListTableColumnsSQL(table, database);

    return that._conn.fetchAll(sql).then(function(tableColumns) {
      return that._getPortableTableColumnList(table, database, tableColumns);
    });
  };

  if (database) {
    return listTableColumns(table, database);
  }

  return this._conn.getDatabase().then(function(database) {
    return listTableColumns(table, database);
  });
};

/**
 * Lists the indexes for a given table returning an array of Index instances.
 *
 * Keys of the portable indexes list are all lower-cased.
 *
 * @param {String} table The name of the table.
 *
 * @returns {Promise} function resolve({Index[]} indexes)
 */
p.listTableIndexes = function(table) {
  var that = this;

  return this._conn.getDatabase().then(function(database) {
    var sql = that._platform.getListTableIndexesSQL(table, database);

    return that._conn.fetchAll(sql).then(function(tableIndexes) {
      return that._getPortableTableIndexesList(tableIndexes, table);
    });
  });
};

/**
 * Returns true if all the given tables exist.
 *
 * @param {Array<String>} tableNames
 *
 * @returns {Promise} function resolve({Boolean} result)
 */
p.tablesExist = function(tableNames) {
  tableNames = tableNames.map(function(tableName) {
    return tableName.toLowerCase();
  });

  return this.listTableNames().then(function(tableNames2) {
    tableNames2 = tableNames2.map(function(tableName) {
      return tableName.toLowerCase();
    });
    tableNames2 = php.array_intersect(tableNames, tableNames2);

    return php.count(tableNames) === php.count(tableNames2);
  });
};

/**
 * Returns a list of all tables in the current database.
 *
 * @return {Promise} function resolve({Array<String>} tableNames)
 */
p.listTableNames = function() {
  var that = this;
  var sql = this._platform.getListTablesSQL();

  return this._conn.fetchAll(sql).then(function(tables) {
    return that._getPortableTablesList(tables);
  });
};

/**
 * Lists the tables for this connection.
 *
 * @returns {Promise} function resolve({Table[]} tables)
 */
p.listTables = function() {
  var that = this;

  return this.listTableNames().then(function(tableNames) {
    var p = new Promise(function(resolve) {
      resolve();
    });
    var tables = {};

    each(tableNames, function(tableName) {
      p = p.then(function() {
        return that.listTableDetails(tableName).then(function(table) {
          tables[tableName] = table;
        });
      });
    });

    return p.then(function() {
      return tables;
    });
  });
};

/**
 * @param {String} tableName
 *
 * @returns {Promise} function resolve({Table} table)
 */
p.listTableDetails = function(tableName) {
  var foreignKeys = [];
  var that = this;

  return this.listTableColumns(tableName).then(function(columns) {
    return that.listTableIndexes(tableName).then(function(indexes) {
      if (that._platform.supportsForeignKeyConstraints()) {
        return that.listTableForeignKeys(tableName).then(function(foreignKeys) {
          return new Table(tableName, columns, indexes, foreignKeys, false, {});
        });
      }

      return new Table(tableName, columns, indexes, foreignKeys, false, {});
    });
  });
};

/**
 * Lists the views this connection has.
 *
 * @returns {Promise} function resolve({View[]} views)
 */
p.listViews = function() {
  var that = this;

  return this._conn.getDatabase().then(function(database) {
    var sql = that._platform.getListViewsSQL(database);

    return that._conn.fetchAll(sql).then(function(views) {
      return that._getPortableViewsList(views);
    });
  });
};

/**
 * Lists the foreign keys for the given table.
 *
 * @param {String}  table    The name of the table.
 * @param {String=} database
 *
 * @return {Promise} function resolve({ForeignKeyConstraint[]} constraints)
 */
p.listTableForeignKeys = function(table, database) {
  database = database ? database : null;

  var that = this;

  var listTableForeignKeys = function(table, database) {
    var sql = that._platform.getListTableForeignKeysSQL(table, database);

    return that._conn.fetchAll(sql).then(function(tableForeignKeys) {
      return that._getPortableTableForeignKeysList(tableForeignKeys);
    });
  };

  if (database) {
    return listTableForeignKeys(table, database);
  }

  return this._conn.getDatabase().then(function(database) {
    return listTableForeignKeys(table, database);
  });
};

/**
 * Drops a database.
 *
 * NOTE: You can not drop the database this SchemaManager is currently connected to.
 *
 * @param {String} database The name of the database to drop.
 *
 * @returns {Promise}
 */
p.dropDatabase = function(database) {
  return this._execSql(this._platform.getDropDatabaseSQL(database));
};

/**
 * Drops the given table.
 *
 * @param {String} tableName The name of the table to drop.
 *
 * @returns {Promise}
 */
p.dropTable = function(tableName) {
  return this._execSql(this._platform.getDropTableSQL(tableName));
};

/**
 * Drops the index from the given table.
 *
 * @param {Index|String} index The name of the index.
 * @param {Table|String} table The name of the table.
 *
 * @returns {Promise}
 */
p.dropIndex = function(index, table) {
  if (index instanceof Index) {
    index = index.getQuotedName(this._platform);
  }

  return this._execSql(this._platform.getDropIndexSQL(index, table));
};

/**
 * Drops the constraint from the given table.
 *
 * @param {Constraint}   constraint
 * @param {Table|String} table      The name of the table.
 *
 * @return {Promise}
 */
p.dropConstraint = function(constraint, table) {
  validArg(constraint, 'constraint', Constraint);

  return this._execSql(this._platform.getDropConstraintSQL(constraint, table));
};

/**
 * Drops a foreign key from a table.
 *
 * @param {ForeignKeyConstraint|String} foreignKey The name of the foreign key.
 * @param {Table|String}                table      The name of the table with the foreign key.
 *
 * @returns {Promise}
 */
p.dropForeignKey = function(foreignKey, table) {
  return this._execSql(this._platform.getDropForeignKeySQL(foreignKey, table));
};

/**
 * Drops a sequence with a given name.
 *
 * @param {String} name The name of the sequence to drop.
 *
 * @returns {Promise}
 */
p.dropSequence = function(name) {
  return this._execSql(this._platform.getDropSequenceSQL(name));
};

/**
 * Drops a view.
 *
 * @param {String} name The name of the view.
 *
 * @returns {Promise}
 */
p.dropView = function(name) {
  return this._execSql(this._platform.getDropViewSQL(name));
};

/**
 * Creates a new database.
 *
 * @param {String} database The name of the database to create.
 *
 * @returns {Promise}
 */
p.createDatabase = function(database) {
  return this._execSql(this._platform.getCreateDatabaseSQL(database));
};

/**
 * Creates a new table.
 *
 * @param {Table} table
 *
 * @returns {Promise}
 */
p.createTable = function(table) {
  var createFlags = AbstractPlatform.CREATE_INDEXES|AbstractPlatform.CREATE_FOREIGNKEYS;

  return this._execSql(this._platform.getCreateTableSQL(table, createFlags));
};

/**
 * Creates a new sequence.
 *
 * @param {Sequence} sequence
 *
 * @return {Promise}
 */
p.createSequence = function(sequence) {
  return this._execSql(this._platform.getCreateSequenceSQL(sequence));
};

/**
 * Creates a constraint on a table.
 *
 * @param {Constraint}   constraint
 * @param {Table|String} table
 *
 * @returns {Promise}
 */
p.createConstraint = function(constraint, table) {
  return this._execSql(this._platform.getCreateConstraintSQL(constraint, table));
};

/**
 * Creates a new index on a table.
 *
 * @param {Index}        index
 * @param {Table|String} table The name of the table on which the index is to be created.
 *
 * @returns {Promise}
 */
p.createIndex = function(index, table) {
  return this._execSql(this._platform.getCreateIndexSQL(index, table));
};

/**
 * Creates a new foreign key.
 *
 * @param {ForeignKeyConstraint} foreignKey The ForeignKey instance.
 * @param {Table|String}         table      The name of the table on which the foreign key is to be created.
 *
 * @returns {Promise}
 */
p.createForeignKey = function(foreignKey, table) {
  return this._execSql(this._platform.getCreateForeignKeySQL(foreignKey, table));
};

/**
 * Creates a new view.
 *
 * @param {View} view
 *
 * @returns {Promise}
 */
p.createView = function(view) {
  this._execSql(this._platform.getCreateViewSQL(view.getQuotedName(this._platform), view.getSql()));
};

/**
 * Drops and creates a constraint.
 *
 * @see dropConstraint
 * @see createConstraint
 *
 * @param {Constraint}   constraint
 * @param {Table|String} table
 *
 * @returns {Promise}
 */
p.dropAndCreateConstraint = function(constraint, table) {
  var that = this;

  return this.dropConstraint(constraint, table).then(function() {
    return that.createConstraint(constraint, table);
  });
};

/**
 * Drops and creates a new index on a table.
 *
 * @param {Index}        index
 * @param {Table|String} table The name of the table on which the index is to be created.
 *
 * @returns {Promise}
 */
p.dropAndCreateIndex = function(index, table) {
  var that = this;

  return this.dropIndex(index.getQuotedName(this._platform), table).then(function() {
    return that.createIndex(index, table);
  });
};

/**
 * Drops and creates a new foreign key.
 *
 * @param {ForeignKeyConstraint} foreignKey An associative array that defines properties of the foreign key to be created.
 * @param {Table|String}         table      The name of the table on which the foreign key is to be created.
 *
 * @returns {Promise}
 */
p.dropAndCreateForeignKey = function(foreignKey, table) {
  var that = this;

  return this.dropForeignKey(foreignKey, table).then(function() {
    return that.createForeignKey(foreignKey, table);
  });
};

/**
 * Drops and create a new sequence.
 *
 * @param {Sequence} sequence
 *
 * @returns {Promise}
 */
p.dropAndCreateSequence = function(sequence) {
  var that = this;

  return this.dropSequence(sequence.getQuotedName(this._platform)).then(function() {
    return that.createSequence(sequence);
  });
};

/**
 * Drops and creates a new table.
 *
 * @param {Table} table
 *
 * @returns {Promise}
 */
p.dropAndCreateTable = function(table) {
  var that = this;

  return this.dropTable(table.getQuotedName(this._platform)).then(function() {
    return that.createTable(table);
  });
};

/**
 * Drops and creates a new database.
 *
 * @param {String} database The name of the database to create.
 *
 * @returns {Promise}
 */
p.dropAndCreateDatabase = function(database) {
  var that = this;

  return this.dropDatabase(database).then(function() {
    return that.createDatabase(database);
  });
};

/**
 * Drops and creates a new view.
 *
 * @param {View} view
 *
 * @returns {Promise}
 */
p.dropAndCreateView = function(view) {
  var that = this;

  return this.dropView(view.getQuotedName(this._platform)).then(function() {
    return that.createView(view);
  });
};

/**
 * Alters an existing tables schema.
 *
 * @param {TableDiff} tableDiff
 *
 * @returns {Promise} function resolve({Array<*>} results)
 */
p.alterTable = function(tableDiff) {
  validArg(tableDiff, 'tableDiff', TableDiff);

  var that = this;
  var queries = this._platform.getAlterTableSQL(tableDiff);
  var returns = [];
  var p = new Promise(function(resolve) {
    resolve();
  });

  if (php.is_array(queries) && php.count(queries)) {
    each(queries, function(ddlQuery) {
      p = p.then(function() {
        return that._execSql(ddlQuery).then(function(results) {
          returns.push(results);
        });
      });
    });
  }

  return p.then(function() {
    return returns;
  });
};

/**
 * Renames a given table to another name.
 *
 * @param {String} name    The current name of the table.
 * @param {String} newName The new name of the table.
 *
 * @returns {Promise} function resolve({Array<*>} results)
 */
p.renameTable = function(name, newName) {
  var tableDiff = new TableDiff(name);

  tableDiff.newName = newName;

  return this.alterTable(tableDiff);
};

/**
 * @param {Array<Object>} databases
 *
 * @return {Array<*>}
 */
p._getPortableDatabasesList = function(databases) {
  var list = [];

  each(databases, function(value) {
    if (value = this._getPortableDatabaseDefinition(value)) {
      list.push(value);
    }
  }.bind(this));

  return list;
};

/**
 * Converts a list of namespace names from the native DBMS data definition to a portable Doctrine definition.
 *
 * @param {Array<Object>} namespaces The list of namespace names in the native DBMS data definition.
 *
 * @return {Array<*>}
 *
 * @access protected
 */
p.getPortableNamespacesList = function(namespaces) {
  var namespacesList = [];

  each(namespaces, function(namespace) {
    namespacesList.push(this.getPortableNamespaceDefinition(namespace));
  }.bind(this));

  return namespacesList;
};

/**
 * @param {Object} database
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableDatabaseDefinition = function(database) {
  return database;
};

/**
 * Converts a namespace definition from the native DBMS data definition to a portable Doctrine definition.
 *
 * @param {Object} namespace The native DBMS namespace definition.
 *
 * @return {*}
 *
 * @access protected
 */
p.getPortableNamespaceDefinition = function(namespace) {
  return namespace;
};

/**
 * @param {Array<Object>} functions
 *
 * @returns {Array}
 *
 * @access protected
 */
p._getPortableFunctionsList = function(functions) {
  var that = this;
  var list = [];

  each(functions, function(value) {
    if (value = that._getPortableFunctionDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} function_
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableFunctionDefinition = function(function_) {
  return function_;
};

/**
 * @param {Array<Object>} triggers
 *
 * @return {Array}
 *
 * @access protected
 */
p._getPortableTriggersList = function(triggers) {
  var that = this;
  var list = [];

  each(triggers, function(value) {
    if (value = that._getPortableTriggerDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} trigger
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableTriggerDefinition = function(trigger) {
  return trigger;
};

/**
 * @param {Array<Object>} sequences
 *
 * @returns {Array}
 *
 * @access protected
 */
p._getPortableSequencesList = function(sequences) {
  var that = this;
  var list = [];

  each(sequences, function(value) {
    if (value = that._getPortableSequenceDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} sequence
 *
 * @return {*}
 *
 * @throws {DBALException}
 *
 * @access protected
 */
p._getPortableSequenceDefinition = function(sequence) {
  throw DBALException.notSupported('Sequences');
};

/**
 * Independent of the database the keys of the column list result are lowercased.
 *
 * The name of the created column instance however is kept in its case.
 *
 * @param {String} table        The name of the table.
 * @param {String} database
 * @param {Array<Object>}  tableColumns
 *
 * @return {Object<String, Column>}
 *
 * @access protected
 *
 * @TODO add event manager
 */
p._getPortableTableColumnList = function(table, database, tableColumns) {
  //$eventManager = $this->_platform->getEventManager();
  var list = {};
  var that = this;

  each(tableColumns, function(tableColumn) {
    var column = null;
    var defaultPrevented = false;

    //if (null !== $eventManager && $eventManager->hasListeners(Events::onSchemaColumnDefinition)) {
    //  $eventArgs = new SchemaColumnDefinitionEventArgs($tableColumn, $table, $database, $this->_conn);
    //  $eventManager->dispatchEvent(Events::onSchemaColumnDefinition, $eventArgs);
    //
    //  $defaultPrevented = $eventArgs->isDefaultPrevented();
    //  $column = $eventArgs->getColumn();
    //}

    if (!defaultPrevented) {
      column = that._getPortableTableColumnDefinition(tableColumn);
    }

    if (column) {
      var name = column.getQuotedName(that._platform).toLowerCase();

      list[name] = column;
    }
  });

  return list;
};

/**
 * Gets Table Column Definition.
 *
 * @param {Object} tableColumn
 *
 * @return {Column}
 *
 * @access protected
 */
p._getPortableTableColumnDefinition = function(tableColumn) {
  throw new MethodNotImplementException('_getPortableTableColumnDefinition');
};

/**
 * Aggregates and groups the index results according to the required data result.
 *
 * @param {Array<Object>} tableIndexRows
 * @param {String=}       tableName
 *
 * @return {Object<String, Index>}
 *
 * @access protected
 */
p._getPortableTableIndexesList = function(tableIndexRows, tableName) {
  var result = {};

  each(tableIndexRows, function(tableIndex) {
    var keyName = tableIndex['key_name'];
    var indexName = tableIndex['key_name'];

    if (tableIndex['primary']) {
      keyName = 'primary';
    }

    keyName = keyName.toLowerCase();

    if (!php.isset(result[keyName])) {
      result[keyName] = {
        "name": indexName,
        "columns": [tableIndex['column_name']],
        "unique": tableIndex['non_unique'] ? false : true,
        "primary": tableIndex['primary'],
        "flags": php.isset(tableIndex['flags']) ? tableIndex['flags'] : [],
        "options": php.isset(tableIndex['where']) ? {"where": tableIndex['where']} : {}
      };
    } else {
      result[keyName]['columns'].push(tableIndex['column_name']);
    }
  });

  //$eventManager = $this->_platform->getEventManager();

  var indexes = {};

  each(result, function(data, indexKey) {
    var index;
    var defaultPrevented = false;

    /*
    if (null !== $eventManager && $eventManager->hasListeners(Events::onSchemaIndexDefinition)) {
      $eventArgs = new SchemaIndexDefinitionEventArgs($data, $tableName, $this->_conn);
        $eventManager->dispatchEvent(Events::onSchemaIndexDefinition, $eventArgs);

      $defaultPrevented = $eventArgs->isDefaultPrevented();
      $index = $eventArgs->getIndex();
    }
    */

    if (!defaultPrevented) {
      index = new Index(data['name'], data['columns'], data['unique'], data['primary'], data['flags'], data['options']);

      indexes[indexKey] = index;
    }
  });

  return indexes;
};


/**
 * @param {Array<Object>} tables
 *
 * @return {Array<Object>}
 *
 * @access protected
 */
p._getPortableTablesList = function(tables) {
  var that = this;
  var list = [];

  each(tables, function(value) {
    if (value = that._getPortableTableDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} table
 *
 * @return {Object}
 */
p._getPortableTableDefinition = function(table) {
  return table;
};

/**
 * @param {Array<Object>} users
 *
 * @return {Array}
 *
 * @access protected
 */
p._getPortableUsersList = function(users) {
  var that = this;
  var list = [];

  each(users, function(value) {
    if (value = that._getPortableUserDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} user
 *
 * @return {*}
 *
 * @access protected
 */
p._getPortableUserDefinition = function(user) {
  return user;
};

/**
 * @param {Array<Object>} views
 *
 * @return {Object<String, View>}
 *
 * @access protected
 */
p._getPortableViewsList = function(views) {
  var list = {};
  var that = this;
  var view;

  each(views, function(value) {
    if (view = that._getPortableViewDefinition(value)) {
      var viewName = view.getQuotedName(that._platform);

      list[viewName] = view;
    }
  });

  return list;
};

/**
 * @param {Object} view
 *
 * @return {View}
 *
 * @access protected
 */
p._getPortableViewDefinition = function(view) {
  return false;
};

/**
 * @param {Array<Object>} tableForeignKeys
 *
 * @return {Array<String>}
 */
p._getPortableTableForeignKeysList = function(tableForeignKeys) {
  var that = this;
  var list = [];

  each(tableForeignKeys, function(value) {
    if (value = that._getPortableTableForeignKeyDefinition(value)) {
      list.push(value);
    }
  });

  return list;
};

/**
 * @param {Object} tableForeignKey
 *
 * @return {Object}
 */
p._getPortableTableForeignKeyDefinition = function(tableForeignKey) {
  return tableForeignKey;
};

/**
 * @param {Array|String} sql
 *
 * @returns {Promise} function resolve({Array<*>} results)
 *
 * @access protected
 */
p._execSql = function(sql) {
  if (typeof sql === 'string') {
    sql = [sql];
  } else {
    validArg(sql, 'sql', 'Array');
  }

  var that = this;
  var returns = [];

  var p = new Promise(function(resolve) {
    resolve();
  });

  each(sql, function(query) {
    p = p.then(function() {
      return that._conn.query(query).then(function(results) {
        returns.push(results);
      });
    });
  });

  return p.then(function() {
    return returns;
  });
};

/**
 * Creates a schema instance for the current database.
 *
 * @returns {Promise} function resolve({Schema} schema)
 */
p.createSchema = function() {
  var that = this;
  var p = new Promise(function(resolve) {
    resolve();
  });
  var namespaces = [];
  var sequences = [];

  if (this._platform.supportsSchemas()) {
    p.then(function() {
      return that.listNamespaceNames().then(function(namespaces_) {
        namespaces = namespaces_;
      });
    });
  }

  if (this._platform.supportsSequences()) {
    p.then(function() {
      return that.listSequences().then(function(sequences_) {
        sequences = sequences_;
      });
    })
  }

  return p.then(function() {
    return that.listTables().then(function(tables) {
      return that.createSchemaConfig().then(function(schemaConfig) {
        return new Schema(tables, sequences, schemaConfig, namespaces);
      });
    });
  });
};

/**
 * Creates the configuration for this schema.
 *
 * @return {Promise} function resolve({SchemaConfig} schemaConfig)
 */
p.createSchemaConfig = function() {
  var schemaConfig = new SchemaConfig();

  schemaConfig.setMaxIdentifierLength(this._platform.getMaxIdentifierLength());

  return this.getSchemaSearchPaths().then(function(searchPaths) {
    if (php.isset(searchPaths[0])) {
      schemaConfig.setName(searchPaths[0]);
    }

    return schemaConfig;
  });
};

/**
 * The search path for namespaces in the currently connected database.
 *
 * The first entry is usually the default namespace in the Schema. All
 * further namespaces contain tables/sequences which can also be addressed
 * with a short, not full-qualified name.
 *
 * For databases that don't support subschema/namespaces this method
 * returns the name of the currently connected database.
 *
 * @return {Promise} function resolve({Array} paths)
 */
p.getSchemaSearchPaths = function() {
  return this._conn.getDatabase().then(function(database) {
    return [database];
  });
};
