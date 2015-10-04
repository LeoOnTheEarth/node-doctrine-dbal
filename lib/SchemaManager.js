module.exports = SchemaManager;

var php = require('phpjs')
  , MySQL = require('./Platforms/MySQL.js')
  , Column = require('./Schema/Column.js')
  , Index = require('./Schema/Index.js')
  , Table = require('./Schema/Table.js')
  , Schema = require('./Schema/Schema.js')
  ;

/**
 * Class SchemaManager
 *
 * @param {Pool|Connection} conn
 * @constructor
 */
function SchemaManager(conn) {
  this.conn = conn;
  //this.database = MySQL.getQuotedName(conn.config.database);
  this.database = MySQL.getQuotedName(conn.config.connectionConfig.database);
}

SchemaManager.prototype.query = function(sql) {
  var self = this;

  return function(cb) {
    self.conn.getConnection(function(err, connection) {
      connection.query(sql, function(err, rows, fields) {
        cb(err, rows, fields);

        connection.release();
      });
    });
  };
};

SchemaManager.prototype.createSchema = function*() {
  var tables = yield this.listTables()
    , schema = new Schema(this.database)
    , tableAmount = tables.length;

  schema.setTables(tables);

  return schema;
};

SchemaManager.prototype.listTables = function*() {
  var tables = yield this.listTableBasics()
    , tableAmount = tables.length
  ;

  for (var i = 0; i < tableAmount; ++i) {
    var tableName = tables[i].name
      , columns = yield this.listTableColumns(tableName)
      , indexes = yield this.listTableIndexes(tableName)
    ;

    tables[i].setColumns(columns);
    tables[i].setIndexes(indexes);
  }

  return tables;
}

SchemaManager.prototype.listTableBasics = function*() {
  var self = this
    , sql = MySQL.getListTablesSQL(self.database)
    , res = yield this.query(sql)
    , tables = []
  ;

  res[0].forEach(function(row) {
    var table = new Table(row['name'], {
        engine: row['engine'],
        collate: row['collate'],
        row_format: row['row_format'],
        comment: row['comment']
      });

    tables.push(table);
  });

  return tables;
};

SchemaManager.prototype.listTableDetails = function*(tableName) {
  var columns = yield this.listTableColumns(tableName)
    , foreignKeys = yield this.listTableForeignKeys(tableName)
    , indexes = yield this.listTableIndexes(tableName)
  ;

  return {
    columns: columns,
    foreignKeys: foreignKeys,
    indexes: indexes
  };
};

SchemaManager.prototype.listTableForeignKeys = function*(tableName) {
  var self = this
    , sql = MySQL.getListTableForeignKeysSQL(MySQL.getQuotedName(tableName), self.database)
    , res = yield this.query(sql)
    , foreignKeys = {}
  ;

  res[0].forEach(function(tableColumn) {
    var constraintName = tableColumn['CONSTRAINT_NAME'];

    if (! foreignKeys.hasOwnProperty(constraintName)) {
      foreignKeys[constraintName] = {
        name: constraintName,
        local: [],
        foreign: [],
        foreignTable: tableColumn['REFERENCED_TABLE_NAME']
      };
    }

    foreignKeys[constraintName].local.push(tableColumn['COLUMN_NAME']);
    foreignKeys[constraintName].foreign.push(tableColumn['REFERENCED_COLUMN_NAME']);
  });

  return foreignKeys;
};

SchemaManager.prototype.listTableIndexes = function*(tableName) {
  var self = this
    , sql = MySQL.getListTableIndexesSQL(MySQL.getQuotedName(tableName), self.database)
    , res = yield this.query(sql)
    , tableIndexes = {}
  ;

  res[0].forEach(function(tableIndex) {
    var keyName = tableIndex['key_name'].toLowerCase();

    if (! tableIndexes.hasOwnProperty(keyName)) {
      var index = new Index(keyName, {
        primary: (tableIndex['key_name'] === 'PRIMARY'),
        unique: (tableIndex['non_unique'] ? false : true),
      });

      if (tableIndex['index_type'].indexOf('FULLTEXT') > -1) {
        index.addFlag('FULLTEXT');
      }

      index.addColumn(tableIndex['column_name']);

      tableIndexes[keyName] = index;
    } else {
      tableIndexes[keyName].addColumn(tableIndex['column_name']);
    }
  });

  return tableIndexes;
};

SchemaManager.prototype.listTableColumns = function*(tableName) {
  var self = this
    , sql = MySQL.getListTableColumnsSQL(MySQL.getQuotedName(tableName), self.database)
    , res = yield this.query(sql)
    , columns = []
  ;

  res[0].forEach(function(tableColumn) {
    columns.push(self.getTableColumnDefinition(tableColumn));
  });

  return columns;
};

SchemaManager.prototype.getTableColumnDefinition = function(tableColumn) {
  var type = tableColumn['type'].toLowerCase()
    , properties = {
      type: php.strtok(type, '(), '),
      length: php.strtok('(), '),
      precision: null,
      scale: parseInt(php.strtok('(), ')),
      default: tableColumn['default'] ? tableColumn['default'] : '',
      pk: tableColumn['key'] === 'PRI',
      unsigned: type.indexOf('unsigned') > -1 ? true : false,
      autoincrement: tableColumn['extra'].indexOf('auto_increment') > -1 ? true : false,
      notnull: tableColumn['null'] !== 'YES',
      zerofill: type.indexOf('zerofill') > -1 ? true : false,
      comment: tableColumn['comment'] ? tableColumn['comment'] : ''
    }
  ;

  if ('decimal' === properties.type) {
    properties.precision = properties.length;
  }

  return new Column(tableColumn['field'], properties);
};
