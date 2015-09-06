module.exports = AbstractPlatform;

var DBALException = require('../Exception/DBALException.js');
var InvalidArgumentException = require('../Exception/InvalidArgumentException.js');
var Connection = require('../Connections/Connection.js');
var LockMode = require('../LockMode.js');
var Table = require('../Schema/Table.js');
var TableDiff = require('../Schema/TableDiff.js');
var Column = require('../Schema/Column.js');
var ColumnDiff = require('../Schema/ColumnDiff.js');
var Index = require('../Schema/Index.js');
var Constraint = require('../Schema/Constraint.js');
var ForeignKeyConstraint = require('../Schema/ForeignKeyConstraint.js');
var Identifier = require('../Schema/Identifier.js');
var AbstractKeywords = require('./Keywords/AbstractKeywords.js');
var AbstractTypeFactory = require('../Types/AbstractTypeFactory.js');
var php = require('phpjs');
var each = require('../util.js').forEach;
var validArg = require('../util.js').validArg;

/**
 * Class AbstractPlatform
 *
 * @constructor
 */
function AbstractPlatform() {}

var p = AbstractPlatform.prototype;

/**
 * Holds the KeywordList instance for the current platform.
 *
 * @type {AbstractKeywords}
 *
 * @access private
 */
var keywords_;

AbstractPlatform.CREATE_INDEXES = 1;
AbstractPlatform.CREATE_FOREIGNKEYS = 2;
AbstractPlatform.DATE_INTERVAL_UNIT_SECOND = 'SECOND';
AbstractPlatform.DATE_INTERVAL_UNIT_MINUTE = 'MINUTE';
AbstractPlatform.DATE_INTERVAL_UNIT_HOUR = 'HOUR';
AbstractPlatform.DATE_INTERVAL_UNIT_DAY = 'DAY';
AbstractPlatform.DATE_INTERVAL_UNIT_WEEK = 'WEEK';
AbstractPlatform.DATE_INTERVAL_UNIT_MONTH = 'MONTH';
AbstractPlatform.DATE_INTERVAL_UNIT_QUARTER = 'QUARTER';
AbstractPlatform.DATE_INTERVAL_UNIT_YEAR = 'YEAR';
AbstractPlatform.TRIM_UNSPECIFIED = 0;
AbstractPlatform.TRIM_LEADING = 1;
AbstractPlatform.TRIM_TRAILING = 2;
AbstractPlatform.TRIM_BOTH = 3;

/**
 * Gets the name of the platform.
 *
 * @returns {string}
 */
p.getName = function() {
  return '';
};

/**
 * Gets the TypeFactory instance for this platform
 *
 * @returns {Object}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getTypeFactory = function() {
  throw DBALException.notSupported('getTypeFactory');
};

/**
 * Gets the character used for identifier quoting.
 *
 * @returns {string}
 */
p.getIdentifierQuoteCharacter = function() {
  return '"';
};

/**
 * Gets the string portion that starts an SQL comment.
 *
 * @returns {string}
 */
p.getSqlCommentStartString = function() {
  return '--';
};

/**
 * Gets the string portion that ends an SQL comment.
 *
 * @returns {string}
 */
p.getSqlCommentEndString = function() {
  return "\n";
};

/**
 * Gets the maximum length of a varchar field.
 *
 * @returns {int}
 */
p.getVarcharMaxLength = function() {
  return 4000;
};

/**
 * Gets the maximum length of a binary field.
 *
 * @returns {int}
 */
p.getBinaryMaxLength = function() {
  return 4000;
};

/**
 * Gets all SQL wildcard characters of the platform.
 *
 * @returns {Array<string>}
 */
p.getWildcards = function() {
  return ['%', '_'];
};

/**
 * Returns the regular expression operator.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getRegexpExpression = function() {
  throw DBALException.notSupported('getRegexpExpression');
};

/**
 * Returns the global unique identifier expression.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getGuidExpression = function() {
  throw DBALException.notSupported('getGuidExpression');
};

/**
 * Returns the SQL snippet to get the average value of a column.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including an AVG aggregate function.
 */
p.getAvgExpression = function(column) {
  return 'AVG(' + column + ')';
};

/**
 * Returns the SQL snippet to get the number of rows (without a NULL value) of a column.
 *
 * If a '*' is used instead of a column the number of selected rows is returned.
 *
 * @param {string|int} column The column to use.
 *
 * @returns {string} Generated SQL including a COUNT aggregate function.
 */
p.getCountExpression = function(column) {
  return 'COUNT(' + column + ')';
};

/**
 * Returns the SQL snippet to get the highest value of a column.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a MAX aggregate function.
 */
p.getMaxExpression = function(column) {
  return 'MAX(' + column + ')';
};

/**
 * Returns the SQL snippet to get the lowest value of a column.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a MIN aggregate function.
 */
p.getMinExpression = function(column) {
  return 'MIN(' + column + ')';
};

/**
 * Returns the SQL snippet to get the total sum of a column.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a SUM aggregate function.
 */
p.getSumExpression = function(column) {
  return 'SUM(' + column + ')';
};

/**
 * Returns the SQL snippet to get the md5 sum of a field.
 *
 * Note: Not SQL92, but common functionality.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a MD5 aggregate function.
 */
p.getMd5Expression = function(column) {
  return 'MD5(' + column + ')';
};

/**
 * Returns the SQL snippet to get the length of a text field.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a LENGTH aggregate function.
 */
p.getLengthExpression = function(column) {
  return 'LENGTH(' + column + ')';
};

/**
 * Returns the SQL snippet to get the squared value of a column.
 *
 * @param {string} column The column to use.
 *
 * @returns {string} Generated SQL including a SQRT aggregate function.
 */
p.getSqrtExpression = function(column) {
  return 'SQRT(' + column + ')';
};

/**
 * Returns the SQL snippet to round a numeric field to the number of decimals specified.
 *
 * @param {string}  column   The column to use.
 * @param {int=}    decimals
 *
 * @returns {string} Generated SQL including a ROUND aggregate function.
 */
p.getRoundExpression = function(column, decimals) {
  decimals = decimals ? decimals : 0;

  return 'ROUND(' + column + ', ' + decimals.toString() + ')';
};

/**
 * Returns the SQL snippet to get the remainder of the division operation {expression1} / {expression2}.
 *
 * @param {string} expression1
 * @param {string} expression2
 *
 * @returns {string} Generated SQL including a MOD aggregate function.
 */
p.getModExpression = function(expression1, expression2) {
  return 'MOD(' + expression1 + ', ' + expression2 + ')';
};

/**
 * Returns the SQL snippet to trim a string.
 *
 * @param {string}          str  The expression to apply the trim to.
 * @param {int=}            pos  The position of the trim (leading/trailing/both).
 * @param {string|boolean=} char The char to trim, has to be quoted already. Defaults to space.
 *
 * @returns {string} Generated SQL including a TRIM aggregate function.
 */
p.getTrimExpression = function(str, pos, char) {
  pos = pos ? pos : AbstractPlatform.TRIM_UNSPECIFIED;
  char = char ? char : false;

  var expression = '';

  switch (pos) {
    case AbstractPlatform.TRIM_LEADING:
      expression = 'LEADING ';
      break;

    case AbstractPlatform.TRIM_TRAILING:
      expression = 'TRAILING ';
      break;

    case AbstractPlatform.TRIM_BOTH:
      expression = 'BOTH ';
      break;
  }

  if (false !== char) {
    expression += char + ' ';
  }

  if (pos || false !== char) {
    expression += 'FROM ';
  }

  return 'TRIM(' + expression + str + ')';
};

/**
 * Returns the SQL snippet to trim trailing space characters from the expression.
 *
 * @param {string} str Literal string or column name.
 *
 * @returns {string} Generated SQL including a RTRIM aggregate function.
 */
p.getRtrimExpression = function(str) {
  return 'RTRIM(' + str + ')';
};

/**
 * Returns the SQL snippet to trim leading space characters from the expression.
 *
 * @param {string} str Literal string or column name.
 *
 * @returns {string} Generated SQL including a LTRIM aggregate function.
 */
p.getLtrimExpression = function(str) {
  return 'LTRIM(' + str + ')';
};

/**
 * Returns the SQL snippet to change all characters from the expression to uppercase,
 * according to the current character set mapping.
 *
 * @param {string} str Literal string or column name.
 *
 * @returns {string} Generated SQL including a UPPER aggregate function.
 */
p.getUpperExpression = function(str) {
  return 'UPPER(' + str + ')';
};

/**
 * Returns the SQL snippet to change all characters from the expression to lowercase,
 * according to the current character set mapping.
 *
 * @param {string} str Literal string or column name.
 *
 * @return {string} Generated SQL including a LOWER aggregate function.
 */
p.getLowerExpression = function(str) {
  return 'LOWER(' + str + ')';
};

/**
 * Returns the SQL snippet to get the position of the first occurrence of substring $substr in string $str.
 *
 * @param {string}       str      Literal string.
 * @param {string}       substr   Literal string to find.
 * @param {int|boolean=} startPos Position to start at, beginning of string by default.
 *
 * @returns {string} Generated SQL including a LOCATE aggregate function.
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getLocateExpression = function(str, substr, startPos) {
  throw DBALException.notSupported('getLocateExpression');
};

/**
 * Returns the SQL snippet to get the current system date.
 *
 * @returns {string}
 */
p.getNowExpression = function() {
  return 'NOW()';
};

/**
 * Returns a SQL snippet to get a substring inside an SQL statement.
 *
 * Note: Not SQL92, but common functionality.
 *
 * SQLite only supports the 2 parameter variant of this function.
 *
 * @param {string}    value  An sql string literal or column name/alias.
 * @param {int}       from   Where to start the substring portion.
 * @param {int|null=} length The substring portion length.
 *
 * @returns {string} Generated SQL including a SUBSTRING aggregate function.
 */
p.getSubstringExpression = function(value, from, length) {
  length = length ? length : null;

  if (null === length) {
    return 'SUBSTRING(' + value + ' FROM ' + from + ')';
  }

  return 'SUBSTRING(' + value + ' FROM ' + from + ' FOR ' + length + ')';
};

/**
 * Returns a SQL snippet to concatenate the given expressions.
 *
 * Accepts an arbitrary number of string parameters. Each parameter must contain an expression.
 *
 * @returns {string}
 */
p.getConcatExpression = function() {
  return arguments.join(' || ');
};

/**
 * Returns the SQL for a logical not.
 *
 * Example:
 *
 * ```php
 * $q = new Doctrine_Query();
 * $e = $q->expr;
 * $q->select('*')->from('table')
 *   ->where($e->eq('id', $e->not('null'));
 * ```
 *
 * @param {string} expression
 *
 * @returns {string} The logical expression.
 */
p.getNotExpression = function(expression) {
  return 'NOT(' + expression + ')';
};

/**
 * Returns the SQL that checks if an expression is null.
 *
 * @param {string} expression The expression that should be compared to null.
 *
 * @returns {string} The logical expression.
 */
p.getIsNullExpression = function(expression) {
  return expression + ' IS NULL';
};

/**
 * Returns the SQL that checks if an expression is not null.
 *
 * @param {string} expression The expression that should be compared to null.
 *
 * @returns {string} The logical expression.
 */
p.getIsNotNullExpression = function(expression) {
  return expression + ' IS NOT NULL';
};

/**
 * Returns the SQL that checks if an expression evaluates to a value between two values.
 *
 * The parameter $expression is checked if it is between $value1 and $value2.
 *
 * Note: There is a slight difference in the way BETWEEN works on some databases.
 * http://www.w3schools.com/sql/sql_between.asp. If you want complete database
 * independence you should avoid using between().
 *
 * @param {string} expression The value to compare to.
 * @param {string} value1     The lower value to compare with.
 * @param {string} value2     The higher value to compare with.
 *
 * @return {string} The logical expression.
 */
p.getBetweenExpression = function(expression, value1, value2) {
  return expression + ' BETWEEN ' + value1 + ' AND ' + value2;
};

/**
 * Returns the SQL to get the arccosine of a value.
 *
 * @param {string} value
 *
 * @returns {string}
 */
p.getAcosExpression = function(value) {
  return 'ACOS(' + value + ')';
};

/**
 * Returns the SQL to get the sine of a value.
 *
 * @param {string} value
 *
 * @returns {string}
 */
p.getSinExpression = function(value) {
  return 'SIN(' + value + ')';
};

/**
 * Returns the SQL to get the PI value.
 *
 * @returns {string}
 */
p.getPiExpression = function() {
  return 'PI()';
};

/**
 * Returns the SQL to get the cosine of a value.
 *
 * @param {string} value
 *
 * @returns {string}
 */
p.getCosExpression = function(value) {
  return 'COS(' + value + ')';
};

/**
 * Returns the SQL to calculate the difference in days between the two passed dates.
 *
 * Computes diff = date1 - date2.
 *
 * @param {string} date1
 * @param {string} date2
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateDiffExpression = function(date1, date2) {
  throw DBALException.notSupported('getDateDiffExpression');
};

/**
 * Returns the SQL to add the number of given seconds to a date.
 *
 * @param {string} date
 * @param {int}    seconds
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddSecondsExpression = function(date, seconds) {
  return this.getDateArithmeticIntervalExpression(date, '+', seconds, AbstractPlatform.DATE_INTERVAL_UNIT_SECOND);
};

/**
 * Returns the SQL to subtract the number of given seconds from a date.
 *
 * @param {string} date
 * @param {int}    seconds
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubSecondsExpression = function(date, seconds) {
  return this.getDateArithmeticIntervalExpression(date, '-', seconds, AbstractPlatform.DATE_INTERVAL_UNIT_SECOND);
};

/**
 * Returns the SQL to add the number of given minutes to a date.
 *
 * @param {string} date
 * @param {int}    minutes
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddMinutesExpression = function(date, minutes) {
  return this.getDateArithmeticIntervalExpression(date, '+', minutes, AbstractPlatform.DATE_INTERVAL_UNIT_MINUTE);
};

/**
 * Returns the SQL to subtract the number of given minutes from a date.
 *
 * @param {string} date
 * @param {int}    minutes
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubMinutesExpression = function(date, minutes) {
  return this.getDateArithmeticIntervalExpression(date, '-', minutes, AbstractPlatform.DATE_INTERVAL_UNIT_MINUTE);
};

/**
 * Returns the SQL to add the number of given hours to a date.
 *
 * @param {string} date
 * @param {int}    hours
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddHourExpression = function(date, hours) {
  return this.getDateArithmeticIntervalExpression(date, '+', hours, AbstractPlatform.DATE_INTERVAL_UNIT_HOUR);
};

/**
 * Returns the SQL to subtract the number of given hours to a date.
 *
 * @param {string} date
 * @param {int}    hours
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubHourExpression = function(date, hours) {
  return this.getDateArithmeticIntervalExpression(date, '-', hours, AbstractPlatform.DATE_INTERVAL_UNIT_HOUR);
};

/**
 * Returns the SQL to add the number of given days to a date.
 *
 * @param {string} date
 * @param {int}    days
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddDaysExpression = function(date, days) {
  return this.getDateArithmeticIntervalExpression(date, '+', days, AbstractPlatform.DATE_INTERVAL_UNIT_DAY);
};

/**
 * Returns the SQL to subtract the number of given days to a date.
 *
 * @param {string} date
 * @param {int}    days
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubDaysExpression = function(date, days) {
  return this.getDateArithmeticIntervalExpression(date, '-', days, AbstractPlatform.DATE_INTERVAL_UNIT_DAY);
};

/**
 * Returns the SQL to add the number of given weeks to a date.
 *
 * @param {string} date
 * @param {int}    weeks
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddWeeksExpression = function(date, weeks) {
  return this.getDateArithmeticIntervalExpression(date, '+', weeks, AbstractPlatform.DATE_INTERVAL_UNIT_WEEK);
};

/**
 * Returns the SQL to subtract the number of given weeks from a date.
 *
 * @param {string} date
 * @param {int}    weeks
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubWeeksExpression = function(date, weeks) {
  return this.getDateArithmeticIntervalExpression(date, '-', weeks, AbstractPlatform.DATE_INTERVAL_UNIT_WEEK);
};

/**
 * Returns the SQL to add the number of given months to a date.
 *
 * @param {string} date
 * @param {int}    months
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddMonthExpression = function(date, months) {
  return this.getDateArithmeticIntervalExpression(date, '+', months, AbstractPlatform.DATE_INTERVAL_UNIT_MONTH);
};

/**
 * Returns the SQL to subtract the number of given months to a date.
 *
 * @param {string} date
 * @param {int}    months
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubMonthExpression = function(date, months) {
  return this.getDateArithmeticIntervalExpression(date, '-', months, AbstractPlatform.DATE_INTERVAL_UNIT_MONTH);
};

/**
 * Returns the SQL to add the number of given quarters to a date.
 *
 * @param {string} date
 * @param {int}    quarters
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddQuartersExpression = function(date, quarters) {
  return this.getDateArithmeticIntervalExpression(date, '+', quarters, AbstractPlatform.DATE_INTERVAL_UNIT_QUARTER);
};

/**
 * Returns the SQL to subtract the number of given quarters from a date.
 *
 * @param {string} date
 * @param {int}    quarters
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubQuartersExpression = function(date, quarters) {
  return this.getDateArithmeticIntervalExpression(date, '-', quarters, AbstractPlatform.DATE_INTERVAL_UNIT_QUARTER);
};

/**
 * Returns the SQL to add the number of given years to a date.
 *
 * @param {string} date
 * @param {int}    years
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateAddYearsExpression = function(date, years) {
  return this.getDateArithmeticIntervalExpression(date, '+', years, AbstractPlatform.DATE_INTERVAL_UNIT_YEAR);
};

/**
 * Returns the SQL to subtract the number of given years from a date.
 *
 * @param {string} date
 * @param {int}    years
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateSubYearsExpression = function(date, years) {
  return this.getDateArithmeticIntervalExpression(date, '-', years, AbstractPlatform.DATE_INTERVAL_UNIT_YEAR);
};

/**
 * Returns the SQL for a date arithmetic expression.
 *
 * @param {string} date     The column or literal representing a date to perform the arithmetic operation on.
 * @param {string} operator The arithmetic operator (+ or -).
 * @param {int}    interval The interval that shall be calculated into the date.
 * @param {string} unit     The unit of the interval that shall be calculated into the date.
 *                          One of the DATE_INTERVAL_UNIT_* constants.
 *
 * @returns {string}
 *
 * @access protected
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDateArithmeticIntervalExpression = function(date, operator, interval, unit) {
  throw DBALException.notSupported('getDateArithmeticIntervalExpression');
};

/**
 * Returns the SQL bit AND comparison expression.
 *
 * @param {string} value1
 * @param {string} value2
 *
 * @returns {string}
 */
p.getBitAndComparisonExpression = function(value1, value2) {
  return '(' + value1 + ' & ' + value2 + ')';
};

/**
 * Returns the SQL bit OR comparison expression.
 *
 * @param {string} value1
 * @param {string} value2
 *
 * @returns {string}
 */
p.getBitOrComparisonExpression = function(value1, value2) {
  return '(' + value1 + ' | ' + value2 + ')';
};

/**
 * Returns the FOR UPDATE expression.
 *
 * @returns {string}
 */
p.getForUpdateSQL = function() {
  return 'FOR UPDATE';
};

/**
 * Honors that some SQL vendors such as MsSql use table hints for locking instead of the ANSI SQL FOR UPDATE specification.
 *
 * @param {string} fromClause The FROM clause to append the hint for the given lock mode to.
 * @param {int}    lockMode   One of the {LockMode.*} constants. If null is given, nothing will
 *                            be appended to the FROM clause.
 *
 * @returns {string}
 */
p.appendLockHint = function(fromClause, lockMode) {
  return fromClause;
};

/**
 * Returns the SQL snippet to append to any SELECT statement which locks rows in shared read lock.
 *
 * This defaults to the ANSI SQL "FOR UPDATE", which is an exclusive lock (Write). Some database
 * vendors allow to lighten this constraint up to be a real read lock.
 *
 * @returns {string}
 */
p.getReadLockSQL = function() {
  return this.getForUpdateSQL();
};

/**
 * Returns the SQL snippet to append to any SELECT statement which obtains an exclusive lock on the rows.
 *
 * The semantics of this lock mode should equal the SELECT .. FOR UPDATE of the ANSI SQL standard.
 *
 * @returns {string}
 */
p.getWriteLockSQL = function() {
  return this.getForUpdateSQL();
};

/**
 * Returns the SQL snippet to drop an existing database.
 *
 * @param {string} database The name of the database that should be dropped.
 *
 * @returns {string}
 */
p.getDropDatabaseSQL = function(database) {
  return 'DROP DATABASE ' + database;
};

/**
 * Returns the SQL snippet to drop an existing table.
 *
 * @param {Table|string} table
 *
 * @returns {string}
 *
 * @throws {InvalidArgumentException}
 *
 * @TODO: Add event manager
 */
p.getDropTableSQL = function(table) {
  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  if (typeof table !== 'string') {
    throw new InvalidArgumentException(
      'AbstractPlatform.getDropTableSQL() expects "table" parameter to be {String} or {Table} instance.'
    );
  }

  /*
  var tableArg = table;

  if (null !== $this->_eventManager && $this->_eventManager->hasListeners(Events::onSchemaDropTable)) {
    var eventArgs = new SchemaDropTableEventArgs(tableArg, this);
    this._eventManager.dispatchEvent(Events.onSchemaDropTable, eventArgs);

    if (eventArgs.isDefaultPrevented()) {
      return eventArgs.getSql();
    }
  }
  */

  return 'DROP TABLE ' + table;
};

/**
 * Returns the SQL to safely drop a temporary table WITHOUT implicitly committing an open transaction.
 *
 * @param {Table|string} table
 *
 * @returns {string}
 */
p.getDropTemporaryTableSQL = function(table) {
  return this.getDropTableSQL(table);
};

/**
 * Returns the SQL to drop an index from a table.
 *
 * @param {Index|string} index
 * @param {Table|string=} table
 *
 * @returns {string}
 *
 * @throws {InvalidArgumentException}
 */
p.getDropIndexSQL = function(index, table) {
  if (index instanceof Index) {
    index = index.getQuotedName(this);
  }

  if (typeof index !== 'string') {
    throw new InvalidArgumentException(
      'AbstractPlatform.getDropIndexSQL() expects "index" parameter to be {String} or {Index} instance.'
    );
  }

  return 'DROP INDEX ' + index;
};

/**
 * Returns the SQL to drop a constraint.
 *
 * @param {Constraint|string} constraint
 * @param {Table|string}      table
 *
 * @returns {string}
 */
p.getDropConstraintSQL = function(constraint, table) {
  if (constraint instanceof Constraint) {
    constraint = constraint.getQuotedName(this);
  }

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  return 'ALTER TABLE ' + table + ' DROP CONSTRAINT ' + constraint;
};

/**
 * Returns the SQL to drop a foreign key.
 *
 * @param {ForeignKeyConstraint|string} foreignKey
 * @param {Table|string}                table
 *
 * @returns {string}
 */
p.getDropForeignKeySQL = function(foreignKey, table) {
  if (foreignKey instanceof ForeignKeyConstraint) {
    foreignKey = foreignKey.getQuotedName(this);
  }

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  return 'ALTER TABLE ' + table + ' DROP FOREIGN KEY ' + foreignKey;
};

/**
 * Returns the SQL statement(s) to create a table with the specified name, columns and constraints
 * on this platform.
 *
 * @param {Table} table
 * @param {int=}  createFlags
 *
 * @return {Array} The sequence of SQL statements.
 *
 * @throws {DBALException}
 * @throws {InvalidArgumentException}
 *
 * @TODO add eventManager
 */
p.getCreateTableSQL = function(table, createFlags) {
  createFlags = createFlags ? createFlags : AbstractPlatform.CREATE_INDEXES;

  if (!Number.isInteger(createFlags)) {
    throw new InvalidArgumentException(
      'Second argument of AbstractPlatform.getCreateTableSQL() has to be {integer} instance.'
    );
  }

  if (php.count(table.getColumns()) === 0) {
    throw DBALException.noColumnsSpecifiedForTable(table.getName());
  }

  var tableName = table.getQuotedName(this);
  var options = table.getOptions();

  options['uniqueConstraints'] = [];
  options['indexes'] = {};
  options['primary'] = [];

  if ((createFlags & AbstractPlatform.CREATE_INDEXES) > 0) {
    each(table.getIndexes(), function(index) {
      if (index.isPrimary()) {
        options['primary']       = index.getQuotedColumns(this);
        options['primary_index'] = index;
      } else {
        options['indexes'][index.getQuotedName(this)] = index;
      }
    }.bind(this));
  }

  var columnSql = [];
  var columns = {};

  each(table.getColumns(), function(column) {
    //if (null !== self._eventManager && self._eventManager.hasListeners(Events.onSchemaCreateTableColumn)) {
    //  $eventArgs = new SchemaCreateTableColumnEventArgs($column, $table, $this);
    //    $this->_eventManager->dispatchEvent(Events::onSchemaCreateTableColumn, $eventArgs);
    //
    //  $columnSql = array_merge($columnSql, $eventArgs->getSql());
    //
    //  if ($eventArgs->isDefaultPrevented()) {
    //    return true;
    //  }
    //}

    var columnData = column.toObject();

    columnData['name']    = column.getQuotedName(this);
    columnData['version'] = column.hasPlatformOption('version') ? column.getPlatformOption('version') : false;
    columnData['comment'] = column.getComment();

    if (columnData['type'].isDoctrineType('string') && columnData['length'] === null) {
      columnData['length'] = 255;
    }

    if (php.in_array(column.getName(), options['primary'])) {
      columnData['primary'] = true;
    }

    columns[columnData['name']] = columnData;
  }.bind(this));


  if ((createFlags & AbstractPlatform.CREATE_FOREIGNKEYS) > 0) {
    options['foreignKeys'] = [];

    each(table.getForeignKeys(), function(fkConstraint) {
      options['foreignKeys'].push(fkConstraint);
    });
  }

  //if (null !== $this->_eventManager && $this->_eventManager->hasListeners(Events::onSchemaCreateTable)) {
  //  $eventArgs = new SchemaCreateTableEventArgs($table, $columns, $options, $this);
  //  $this->_eventManager->dispatchEvent(Events::onSchemaCreateTable, $eventArgs);
  //
  //  if ($eventArgs->isDefaultPrevented()) {
  //    return array_merge($eventArgs->getSql(), $columnSql);
  //  }
  //}

  var sql = this._getCreateTableSQL(tableName, columns, options);

  if (this.supportsCommentOnStatement()) {
    table.getColumns().forEach(function(column) {
      var comment = column.getComment();

      if (!php.empty(comment)) {
        sql.push(this.getCommentOnColumnSQL(tableName, column.getQuotedName(this), comment));
      }
    }.bind(this));
  }

  return php.array_merge(sql, columnSql);
};

/**
 * @param {string} tableName
 * @param {string} columnName
 * @param {string} comment
 *
 * @returns {string}
 */
p.getCommentOnColumnSQL = function(tableName, columnName, comment) {
  var tableNameIdentifier = new Identifier(tableName);
  var columnNameIdentifier = new Identifier(columnName);

  comment = this.quoteStringLiteral(comment);

  return 'COMMENT ON COLUMN ' +
    tableNameIdentifier.getQuotedName(this) + '.' + columnNameIdentifier.getQuotedName(this) +
    ' IS ' + comment;
};

/**
 * Returns the SQL used to create a table.
 *
 * @param {string}                 tableName
 * @param {Object<string, Object>} columns
 * @param {Object<string, *>=}     options
 *
 * @return {Array<string>}
 *
 * @access protected
 */
p._getCreateTableSQL = function(tableName, columns, options) {
  options = options ? options : {};

  validArg(columns, 'columns', 'Object');
  validArg(options, 'options', 'Object');

  var columnListSql = this.getColumnDeclarationListSQL(columns);

  if (php.isset(options['uniqueConstraints'])) {
    each(options['uniqueConstraints'], function(definition, name) {
      columnListSql += ', ' + this.getUniqueConstraintDeclarationSQL(name, definition);
    }.bind(this));
  }

  if (!php.empty(options['primary'])) {
    columnListSql += ', PRIMARY KEY(' + php.array_values(php.array_unique(options['primary'])).join(', ') + ')';
  }

  if (php.isset(options['indexes'])) {
    each(options['indexes'], function(definition, index) {
      columnListSql += ', ' + this.getIndexDeclarationSQL(index, definition);
    }.bind(this));
  }

  var query = 'CREATE TABLE ' + tableName + ' (' + columnListSql;
  var check = this.getCheckDeclarationSQL(columns);

  if (check) {
    query += ', ' + check;
  }

  query += ')';

  var sql = [query];

  if (php.isset(options['foreignKeys'])) {
    each(options['foreignKeys'], function(definition) {
      sql.push(this.getCreateForeignKeySQL(definition, tableName));
    }.bind(this));
  }

  return sql;
};

/**
 * @returns {string}
 */
p.getCreateTemporaryTableSnippetSQL = function() {
  return "CREATE TEMPORARY TABLE";
};

/**
 * Returns the SQL to create a sequence on this platform.
 *
 * @param {Sequence} sequence
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getCreateSequenceSQL = function(sequence) {
  throw DBALException.notSupported('getCreateSequenceSQL');
};

/**
 * Returns the SQL to change a sequence on this platform.
 *
 * @param {Sequence} sequence
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getAlterSequenceSQL = function(sequence) {
  throw DBALException.notSupported('getAlterSequenceSQL');
};

/**
 * Returns the SQL to create a constraint on a table on this platform.
 *
 * @param {Constraint}   constraint
 * @param {Table|string} table
 *
 * @returns {string}
 *
 * @throws {DBALException}
 */
p.getCreateConstraintSQL = function(constraint, table) {
  validArg(constraint, 'constraint', Constraint);

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  if (typeof table !== 'string') {
    throw new InvalidArgumentException(
      'AbstractPlatform.getCreateConstraintSQL() expects "table" parameter to be {String} or {Table} instance.'
    );
  }

  var query = 'ALTER TABLE ' + table + ' ADD CONSTRAINT ' + constraint.getQuotedName(this);
  var columnList = '(' + constraint.getQuotedColumns(this).join(', ') + ')';
  var referencesClause = '';

  if (constraint instanceof Index) {
    if (constraint.isPrimary()) {
      query += ' PRIMARY KEY';
    } else if (constraint.isUnique()) {
      query += ' UNIQUE';
    } else {
      throw new InvalidArgumentException(
        'Can only create primary or unique constraints, no common indexes with getCreateConstraintSQL().'
      );
    }
  } else if (constraint instanceof ForeignKeyConstraint) {
    query += ' FOREIGN KEY';
    referencesClause = ' REFERENCES ' + constraint.getQuotedForeignTableName(this) +
      ' (' + constraint.getQuotedForeignColumns(this).join(', ') + ')';
  }

  query += ' ' + columnList + referencesClause;

  return query;
};

/**
 * Returns the SQL to create an index on a table on this platform.
 *
 * @param {Index}        index
 * @param {Table|string} table The name of the table on which the index is to be created.
 *
 * @returns {string}
 *
 * @throws {InvalidArgumentException}
 */
p.getCreateIndexSQL = function(index, table) {
  validArg(index, 'index', Index);

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  if (typeof table !== 'string') {
    throw new InvalidArgumentException(
      'AbstractPlatform.getCreateIndexSQL() expects "table" parameter to be {String} or {Table} instance.'
    );
  }

  var name = index.getQuotedName(this);
  var columns = index.getQuotedColumns(this);

  if (columns.length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'columns' required.");
  }

  if (index.isPrimary()) {
    return this.getCreatePrimaryKeySQL(index, table);
  }

  return 'CREATE ' + this.getCreateIndexSQLFlags(index) + 'INDEX ' + name + ' ON ' + table
    + ' (' + this.getIndexFieldDeclarationListSQL(columns) + ')' + this.getPartialIndexSQL(index);
};

/**
 * Adds condition for partial index.
 *
 * @param {Index} index
 *
 * @returns {string}
 *
 * @access protected
 */
p.getPartialIndexSQL = function(index)
{
  if (this.supportsPartialIndexes() && index.hasOption('where')) {
    return  ' WHERE ' + index.getOption('where');
  }

  return '';
};

/**
 * Adds additional flags for index generation.
 *
 * @param {Index} index
 *
 * @returns {string}
 *
 * @access protected
 */
p.getCreateIndexSQLFlags = function(index) {
  return index.isUnique() ? 'UNIQUE ' : '';
};

/**
 * Returns the SQL to create an unnamed primary key constraint.
 *
 * @param {Index}        index
 * @param {Table|string} table
 *
 * @returns {string}
 */
p.getCreatePrimaryKeySQL = function(index, table) {
  validArg(index, 'index', Index);

  return 'ALTER TABLE ' + table + ' ADD PRIMARY KEY (' +
    this.getIndexFieldDeclarationListSQL(index.getQuotedColumns(this)) + ')';
};

/**
 * Returns the SQL to create a named schema.
 *
 * @param {string} schemaName
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getCreateSchemaSQL = function(schemaName) {
  throw DBALException.notSupported('getCreateSchemaSQL');
};

/**
 * Quotes a string so that it can be safely used as a table or column name,
 * even if it is a reserved word of the platform. This also detects identifier
 * chains separated by dot and quotes them independently.
 *
 * NOTE: Just because you CAN use quoted identifiers doesn't mean
 * you SHOULD use them. In general, they end up causing way more
 * problems than they solve.
 *
 * @param {string} str The identifier name to be quoted.
 *
 * @returns {string} The quoted identifier string.
 */
p.quoteIdentifier = function(str) {
  if (str.indexOf('.') > -1) {
    return str.split('.').map(this.quoteSingleIdentifier, this).join('.');
  }

  return this.quoteSingleIdentifier(str);
};

/**
 * Quotes a single identifier (no dot chain separation).
 *
 * @param {string} str The identifier name to be quoted.
 *
 * @returns {string} The quoted identifier string.
 */
p.quoteSingleIdentifier = function(str) {
  var c = this.getIdentifierQuoteCharacter();

  return c + str.replace(new RegExp(c), c + c) + c;
};

/**
 * Returns the SQL to create a new foreign key.
 *
 * @param {ForeignKeyConstraint} foreignKey The foreign key constraint.
 * @param {Table|string}         table      The name of the table on which the foreign key is to be created.
 *
 * @returns {string}
 */
p.getCreateForeignKeySQL = function(foreignKey, table) {
  validArg(foreignKey, 'foreignKey', ForeignKeyConstraint);

  if (table instanceof Table) {
    table = table.getQuotedName(this);
  }

  if (typeof table !== 'string') {
    throw new InvalidArgumentException(
      'AbstractPlatform.getCreateIndexSQL() expects "table" parameter to be {String} or {Table} instance.'
    );
  }

  return 'ALTER TABLE ' + table + ' ADD ' + this.getForeignKeyDeclarationSQL(foreignKey);
};

/**
 * Gets the SQL statements for altering an existing table.
 *
 * This method returns an array of SQL statements, since some platforms need several statements.
 *
 * @param {TableDiff} diff
 *
 * @return {Array}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getAlterTableSQL = function(diff) {
  throw DBALException.notSupported('getAlterTableSQL');
};

/**
 * @param {Column}        column
 * @param {TableDiff}     diff
 * @param {Array<string>} columnSql
 *
 * @return {boolean}
 *
 * @access protected
 *
 * @TODO added _eventManager
 */
p.onSchemaAlterTableAddColumn = function(column, diff, columnSql) {
  validArg(column, 'column', Column);
  validArg(diff, 'diff', TableDiff);
  validArg(columnSql, 'columnSql', 'Array');

  //if (null === this._eventManager) {
  //  return false;
  //}

  //if ( ! $this->_eventManager->hasListeners(Events::onSchemaAlterTableAddColumn)) {
  //  return false;
  //}
  //
  //$eventArgs = new SchemaAlterTableAddColumnEventArgs($column, $diff, $this);
  //$this->_eventManager->dispatchEvent(Events::onSchemaAlterTableAddColumn, $eventArgs);
  //
  //each(eventArgs.getSql(), function(sql) {
  //  columnSql.push(sql);
  //});
  //
  //return $eventArgs->isDefaultPrevented();

  return false;
};

/**
 * @param {Column}        column
 * @param {TableDiff}     diff
 * @param {Array<string>} columnSql
 *
 * @return {boolean}
 *
 * @access protected
 *
 * @TODO added _eventManager
 */
p.onSchemaAlterTableRemoveColumn = function (column, diff, columnSql) {
  validArg(column, 'column', Column);
  validArg(diff, 'diff', TableDiff);
  validArg(columnSql, 'columnSql', 'Array');

  //if (null === $this->_eventManager) {
  //  return false;
  //}
  //
  //if ( ! $this->_eventManager->hasListeners(Events::onSchemaAlterTableRemoveColumn)) {
  //  return false;
  //}
  //
  //$eventArgs = new SchemaAlterTableRemoveColumnEventArgs($column, $diff, $this);
  //$this->_eventManager->dispatchEvent(Events::onSchemaAlterTableRemoveColumn, $eventArgs);
  //
  //each(eventArgs.getSql(), function(sql) {
  //  columnSql.push(sql);
  //});
  //
  //return $eventArgs->isDefaultPrevented();

  return false;
};

/**
 * @param {ColumnDiff}    columnDiff
 * @param {TableDiff}     diff
 * @param {Array<string>} columnSql
 *
 * @return {boolean}
 *
 * @access protected
 *
 * @TODO added _eventManager
 */
p.onSchemaAlterTableChangeColumn = function(columnDiff, diff, columnSql) {
  validArg(columnDiff, 'columnDiff', ColumnDiff);
  validArg(diff, 'diff', TableDiff);
  validArg(columnSql, 'columnSql', 'Array');

  //if (null === $this->_eventManager) {
  //  return false;
  //}
  //
  //if ( ! $this->_eventManager->hasListeners(Events::onSchemaAlterTableChangeColumn)) {
  //  return false;
  //}
  //
  //$eventArgs = new SchemaAlterTableChangeColumnEventArgs($columnDiff, $diff, $this);
  //$this->_eventManager->dispatchEvent(Events::onSchemaAlterTableChangeColumn, $eventArgs);
  //
  //each(eventArgs.getSql(), function(sql) {
  //  columnSql.push(sql);
  //});
  //
  //return $eventArgs->isDefaultPrevented();

  return false;
};

/**
 * @param {string}        oldColumnName
 * @param {Column}        column
 * @param {TableDiff}     diff
 * @param {Array<string>} columnSql
 *
 * @return {boolean}
 *
 * @access protected
 *
 * @TODO added _eventManager
 */
p.onSchemaAlterTableRenameColumn = function(oldColumnName, column, diff, columnSql) {
  validArg(column, 'column', Column);
  validArg(diff, 'diff', TableDiff);
  validArg(columnSql, 'columnSql', 'Array');

  //if (null === $this->_eventManager) {
  //  return false;
  //}
  //
  //if ( ! $this->_eventManager->hasListeners(Events::onSchemaAlterTableRenameColumn)) {
  //  return false;
  //}
  //
  //$eventArgs = new SchemaAlterTableRenameColumnEventArgs($oldColumnName, $column, $diff, $this);
  //$this->_eventManager->dispatchEvent(Events::onSchemaAlterTableRenameColumn, $eventArgs);
  //
  //each(eventArgs.getSql(), function(sql) {
  //  columnSql.push(sql);
  //});
  //
  //return $eventArgs->isDefaultPrevented();

  return false;
};

/**
 * @param {TableDiff}     diff
 * @param {Array<string>} sql
 *
 * @return {boolean}
 *
 * @access protected
 *
 * @TODO added _eventManager
 */
p.onSchemaAlterTable = function(diff, sql) {
  validArg(diff, 'diff', TableDiff);
  validArg(sql, 'sql', 'Array');

  //if (null === $this->_eventManager) {
  //  return false;
  //}
  //
  //if ( ! $this->_eventManager->hasListeners(Events::onSchemaAlterTable)) {
  //  return false;
  //}
  //
  //$eventArgs = new SchemaAlterTableEventArgs($diff, $this);
  //$this->_eventManager->dispatchEvent(Events::onSchemaAlterTable, $eventArgs);
  //
  //each(eventArgs.getSql(), function(sql_) {
  //  sql.push(sql_);
  //});

  //
  //return $eventArgs->isDefaultPrevented();

  return false;
};

/**
 * @param {TableDiff} diff
 *
 * @return {Array<string>}
 *
 * @access protected
 */
p.getPreAlterTableIndexForeignKeySQL = function(diff) {
  validArg(diff, 'diff', TableDiff);

  var tableName = diff.getName(this).getQuotedName(this);
  var sql = [];

  if (this.supportsForeignKeyConstraints()) {
    each(diff.removedForeignKeys, function(foreignKey) {
      sql.push(this.getDropForeignKeySQL(foreignKey, tableName));
    }.bind(this));

    each(diff.changedForeignKeys, function(foreignKey) {
      sql.push(this.getDropForeignKeySQL(foreignKey, tableName));
    }.bind(this));
  }

  each(diff.removedIndexes, function(index) {
    sql.push(this.getDropIndexSQL(index, tableName));
  }.bind(this));

  each(diff.changedIndexes, function(index) {
    sql.push(this.getDropIndexSQL(index, tableName));
  }.bind(this));

  return sql;
};

/**
 * @param {TableDiff} diff
 *
 * @return {Array<string>}
 *
 * @access protected
 */
p.getPostAlterTableIndexForeignKeySQL = function(diff) {
  validArg(diff, 'diff', TableDiff);

  var tableName = (false !== diff.newName)
    ? diff.getNewName().getQuotedName(this)
    : diff.getName(this).getQuotedName(this);
  var sql = [];

  if (this.supportsForeignKeyConstraints()) {
    each(diff.addedForeignKeys, function(foreignKey) {
      sql.push(this.getCreateForeignKeySQL(foreignKey, tableName));
    }.bind(this));

    each(diff.changedForeignKeys, function(foreignKey) {
      sql.push(this.getCreateForeignKeySQL(foreignKey, tableName));
    }.bind(this));
  }

  each(diff.addedIndexes, function(index) {
    sql.push(this.getCreateIndexSQL(index, tableName));
  }.bind(this));

  each(diff.changedIndexes, function(index) {
    sql.push(this.getCreateIndexSQL(index, tableName));
  }.bind(this));

  each(diff.renamedIndexes, function(index, oldIndexName) {
    oldIndexName = new Identifier(oldIndexName);

    this.getRenameIndexSQL(oldIndexName.getQuotedName(this), index, tableName).forEach(function(sql_) {
      sql.push(sql_);
    });
  }.bind(this));

  return sql;
};

/**
 * Returns the SQL for renaming an index on a table.
 *
 * @param {string} oldIndexName The name of the index to rename from.
 * @param {Index}  index        The definition of the index to rename to.
 * @param {string} tableName    The table to rename the given index on.
 *
 * @return {Array<string>} The sequence of SQL statements for renaming the given index.
 *
 * @access protected
 */
p.getRenameIndexSQL = function(oldIndexName, index, tableName) {
  return [
    this.getDropIndexSQL(oldIndexName, tableName),
    this.getCreateIndexSQL(index, tableName)
  ];
};

/**
 * Common code for alter table statement generation that updates the changed Index and Foreign Key definitions.
 *
 * @param {TableDiff} diff
 *
 * @return {Array<string>}
 *
 * @access protected
 */
p._getAlterTableIndexForeignKeySQL = function(diff) {
  return php.array_merge(
    this.getPreAlterTableIndexForeignKeySQL(diff),
    this.getPostAlterTableIndexForeignKeySQL(diff)
  );
};

/**
 * Gets declaration of a number of fields in bulk.
 *
 * @param {Object} fields A multidimensional associative array.
 *                        The first dimension determines the field name, while the second
 *                        dimension is keyed with the name of the properties
 *                        of the field being declared as array indexes. Currently, the types
 *                        of supported field properties are as follows:
 *
 *     length
 *       Integer value that determines the maximum length of the text
 *       field. If this argument is missing the field should be
 *       declared to have the longest length allowed by the DBMS.
 *
 *     default
 *       Text value to be used as default for this field.
 *
 *     notnull
 *       Boolean flag that indicates whether this field is constrained
 *       to not be set to null.
 *
 *     charset
 *       Text value with the default CHARACTER SET for this field.
 *
 *     collation
 *       Text value with the default COLLATION for this field.
 *
 *     unique
 *       unique constraint
 *
 * @returns {string}
 */
p.getColumnDeclarationListSQL = function(fields) {
  var queryFields = [];

  each(fields, function(field, fieldName) {
    queryFields.push(this.getColumnDeclarationSQL(fieldName, field));
  }.bind(this));

  return queryFields.join(', ');
};

/**
 * Obtains DBMS specific SQL code portion needed to declare a generic type
 * field to be used in statements like CREATE TABLE.
 *
 * @param {string} name  The name the field to be declared.
 * @param {Object} field An associative array with the name of the properties
 *                       of the field being declared as array indexes. Currently, the types
 *                       of supported field properties are as follows:
 *
 *     length
 *       Integer value that determines the maximum length of the text
 *       field. If this argument is missing the field should be
 *       declared to have the longest length allowed by the DBMS.
 *
 *     default
 *       Text value to be used as default for this field.
 *
 *     notnull
 *       Boolean flag that indicates whether this field is constrained
 *       to not be set to null.
 *
 *     charset
 *       Text value with the default CHARACTER SET for this field.
 *
 *     collation
 *       Text value with the default COLLATION for this field.
 *
 *     unique
 *       unique constraint
 *
 *     check
 *       column check constraint
 *
 *     columnDefinition
 *       a string that defines the complete column
 *
 * @returns {string} DBMS specific SQL code portion that should be used to declare the column.
 */
p.getColumnDeclarationSQL = function(name, field) {
  var columnDef;

  if (php.isset(field['columnDefinition'])) {
    columnDef = this.getCustomTypeDeclarationSQL(field);
  } else {
    var default_ = this.getDefaultValueDeclarationSQL(field);

    var charset = php.isset(field['charset']) && field['charset'] ?
      ' ' + this.getColumnCharsetDeclarationSQL(field['charset']) : '';

    var collation = php.isset(field['collation']) && field['collation'] ?
      ' ' + this.getColumnCollationDeclarationSQL(field['collation']) : '';

    var notnull = php.isset(field['notnull']) && field['notnull'] ? ' NOT NULL' : '';

    var unique = php.isset(field['unique']) && field['unique'] ? ' ' + this.getUniqueFieldDeclarationSQL() : '';

    var check = php.isset(field['check']) && field['check'] ? ' ' + field['check'] : '';

    var typeDeclaration = field['type'].getSQLDeclaration(field);

    columnDef = typeDeclaration + charset + default_ + notnull + unique + check + collation;
  }

  if (this.supportsInlineColumnComments() && php.isset(field['comment']) && field['comment'] !== '') {
    columnDef += ' COMMENT ' + this.quoteStringLiteral(field['comment']);
  }

  return name + ' ' + columnDef;
};

/**
 * Obtains DBMS specific SQL code portion needed to set a default value
 * declaration to be used in statements like CREATE TABLE.
 *
 * @param {Object} field The field definition array.
 *
 * @returns {string} DBMS specific SQL code portion needed to set a default value.
 */
p.getDefaultValueDeclarationSQL = function(field) {
  var sql = php.empty(field['notnull']) ? ' DEFAULT NULL' : '';

  if (php.isset(field['default'])) {
    sql = " DEFAULT '" + field['default'] + "'";

    if (php.isset(field['type'])) {
      var type = field['type'];

      if (type.isDoctrineType(['Integer', 'BigInt', 'SmallInt'])) {
        sql = ' DEFAULT ' + field['default'];
      } else if (type.isDoctrineType(['DateTime', 'DateTimeTz']) && field['default'] === this.getCurrentTimestampSQL()) {
        sql = ' DEFAULT ' + this.getCurrentTimestampSQL();
      } else if (type.isDoctrineType('Time') && field['default'] === this.getCurrentTimeSQL()) {
        sql = ' DEFAULT ' + this.getCurrentTimeSQL();
      } else if (type.isDoctrineType('Date') && field['default'] === this.getCurrentDateSQL()) {
        sql = ' DEFAULT ' + this.getCurrentDateSQL();
      } else if (type.isDoctrineType('Boolean')) {
        sql = " DEFAULT '" + this.convertBooleans(field['default']) + "'";
      }
    }
  }

  return sql;
};

/**
 * Obtains DBMS specific SQL code portion needed to set a CHECK constraint
 * declaration to be used in statements like CREATE TABLE.
 *
 * @param {Object<string, Object|string>} definition The check definition.
 *
 * @returns {string} DBMS specific SQL code portion needed to set a CHECK constraint.
 */
p.getCheckDeclarationSQL = function(definition) {
  var constraints = [];

  each(definition, function(def, field) {
    if (typeof def === 'string') {
      constraints.push('CHECK (' + def + ')');
    } else {
      if (php.isset(def['min'])) {
        constraints.push('CHECK (' + field + ' >= ' + def['min'] + ')');
      }

      if (php.isset(def['max'])) {
        constraints.push('CHECK (' + field + ' <= ' + def['max'] + ')');
      }
    }
  });

  return constraints.join(', ');
};

/**
 * Obtains DBMS specific SQL code portion needed to set a unique
 * constraint declaration to be used in statements like CREATE TABLE.
 *
 * @param {string} name  The name of the unique constraint.
 * @param {Index}  index The index definition.
 *
 * @returns {string} DBMS specific SQL code portion needed to set a constraint.
 *
 * @throws {InvalidArgumentException}
 */
p.getUniqueConstraintDeclarationSQL = function(name, index) {
  validArg(index, 'index', Index);

  var columns = index.getQuotedColumns(this);
  var name_ = new Identifier(name);

  if (columns.length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'columns' required.");
  }

  return 'CONSTRAINT ' + name_.getQuotedName(this) + ' UNIQUE ('
    + this.getIndexFieldDeclarationListSQL(columns)
    + ')' + this.getPartialIndexSQL(index);
};

/**
 * Obtains DBMS specific SQL code portion needed to set an index
 * declaration to be used in statements like CREATE TABLE.
 *
 * @param {string} name  The name of the index.
 * @param {Index}  index The index definition.
 *
 * @returns {string} DBMS specific SQL code portion needed to set an index.
 *
 * @throws {InvalidArgumentException}
 */
p.getIndexDeclarationSQL = function(name, index) {
  validArg(index, 'index', Index);

  var columns = index.getQuotedColumns(this);
  var name_ = new Identifier(name);

  if (columns.length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'columns' required.");
  }

  return this.getCreateIndexSQLFlags(index) + 'INDEX ' + name_.getQuotedName(this) + ' ('
    + this.getIndexFieldDeclarationListSQL(columns)
    + ')' + this.getPartialIndexSQL(index);
};

/**
 * Obtains SQL code portion needed to create a custom column,
 * e.g. when a field has the "columnDefinition" keyword.
 * Only "AUTOINCREMENT" and "PRIMARY KEY" are added if appropriate.
 *
 * @param {Object} columnDef
 *
 * @returns {string}
 */
p.getCustomTypeDeclarationSQL = function(columnDef) {
  return columnDef['columnDefinition'];
};

/**
 * Obtains DBMS specific SQL code portion needed to set an index
 * declaration to be used in statements like CREATE TABLE.
 *
 * @param {Object<string, *>} fields
 *
 * @returns {string}
 */
p.getIndexFieldDeclarationListSQL = function(fields) {
  var ret = [];

  each(fields, function(definition, field) {
    ret.push(typeof definition !== 'string' ? field : definition);
  });

  return ret.join(', ');
};

/**
 * Returns the required SQL string that fits between CREATE ... TABLE
 * to create the table as a temporary table.
 *
 * Should be overridden in driver classes to return the correct string for the
 * specific database type.
 *
 * The default is to return the string "TEMPORARY" - this will result in a
 * SQL error for any database that does not support temporary tables, or that
 * requires a different SQL command from "CREATE TEMPORARY TABLE".
 *
 * @returns {string} The string required to be placed between "CREATE" and "TABLE"
 *                   to generate a temporary table, if possible.
 */
p.getTemporaryTableSQL = function() {
  return 'TEMPORARY';
};

/**
 * Some vendors require temporary table names to be qualified specially.
 *
 * @param {string} tableName
 *
 * @returns {string}
 */
p.getTemporaryTableName = function(tableName) {
  return tableName;
};

/**
 * Obtain DBMS specific SQL code portion needed to set the FOREIGN KEY constraint
 * of a field declaration to be used in statements like CREATE TABLE.
 *
 * @param {ForeignKeyConstraint} foreignKey
 *
 * @returns {string} DBMS specific SQL code portion needed to set the FOREIGN KEY constraint
 *                   of a field declaration.
 */
p.getForeignKeyDeclarationSQL = function(foreignKey) {
  validArg(foreignKey, 'foreignKey', ForeignKeyConstraint);

  return this.getForeignKeyBaseDeclarationSQL(foreignKey) + this.getAdvancedForeignKeyOptionsSQL(foreignKey);
};

/**
 * Returns the FOREIGN KEY query section dealing with non-standard options
 * as MATCH, INITIALLY DEFERRED, ON UPDATE, ...
 *
 * @param {ForeignKeyConstraint} foreignKey The foreign key definition.
 *
 * @returns {string}
 */
p.getAdvancedForeignKeyOptionsSQL = function(foreignKey) {
  validArg(foreignKey, 'foreignKey', ForeignKeyConstraint);

  var query = '';

  if (this.supportsForeignKeyOnUpdate() && foreignKey.hasOption('onUpdate')) {
    query += ' ON UPDATE ' + this.getForeignKeyReferentialActionSQL(foreignKey.getOption('onUpdate'));
  }

  if (foreignKey.hasOption('onDelete')) {
    query += ' ON DELETE ' + this.getForeignKeyReferentialActionSQL(foreignKey.getOption('onDelete'));
  }

  return query;
};

/**
 * Returns the given referential action in uppercase if valid, otherwise throws an exception.
 *
 * @param {string} action The foreign key referential action.
 *
 * @returns {string}
 *
 * @throws {InvalidArgumentException} If unknown referential action given
 */
p.getForeignKeyReferentialActionSQL = function(action) {
  var upper = action.toUpperCase();

  switch (upper) {
    case 'CASCADE':
    case 'SET NULL':
    case 'NO ACTION':
    case 'RESTRICT':
    case 'SET DEFAULT':
      return upper;
    default:
      throw new InvalidArgumentException('Invalid foreign key action: ' + upper);
  }
};

/**
 * Obtains DBMS specific SQL code portion needed to set the FOREIGN KEY constraint
 * of a field declaration to be used in statements like CREATE TABLE.
 *
 * @param {ForeignKeyConstraint} foreignKey
 *
 * @returns {string}
 *
 * @throws {InvalidArgumentException}
 */
p.getForeignKeyBaseDeclarationSQL = function(foreignKey) {
  validArg(foreignKey, 'foreignKey', ForeignKeyConstraint);

  var sql = '';

  if (foreignKey.getName().length) {
    sql += 'CONSTRAINT ' + foreignKey.getQuotedName(this) + ' ';
  }

  sql += 'FOREIGN KEY (';

  if (foreignKey.getLocalColumns().length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'local' required.");
  }

  if (foreignKey.getForeignColumns().length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'foreign' required.");
  }

  if (foreignKey.getForeignTableName().length === 0) {
    throw new InvalidArgumentException("Incomplete definition. 'foreignTable' required.");
  }

  sql += foreignKey.getQuotedLocalColumns(this).join(', ')
    + ') REFERENCES '
    + foreignKey.getQuotedForeignTableName(this) + ' ('
    + foreignKey.getQuotedForeignColumns(this).join(', ') + ')';

  return sql;
};

/**
 * Obtains DBMS specific SQL code portion needed to set the UNIQUE constraint
 * of a field declaration to be used in statements like CREATE TABLE.
 *
 * @returns {string} DBMS specific SQL code portion needed to set the UNIQUE constraint
 *                   of a field declaration.
 */
p.getUniqueFieldDeclarationSQL = function() {
  return 'UNIQUE';
};

/**
 * Obtains DBMS specific SQL code portion needed to set the CHARACTER SET
 * of a field declaration to be used in statements like CREATE TABLE.
 *
 * @param {string} charset The name of the charset.
 *
 * @returns {string} DBMS specific SQL code portion needed to set the CHARACTER SET
 *                   of a field declaration.
 */
p.getColumnCharsetDeclarationSQL = function(charset) {
  return '';
};

/**
 * Obtains DBMS specific SQL code portion needed to set the COLLATION
 * of a field declaration to be used in statements like CREATE TABLE.
 *
 * @param {string} collation The name of the collation.
 *
 * @returns {string} DBMS specific SQL code portion needed to set the COLLATION
 *                   of a field declaration.
 */
p.getColumnCollationDeclarationSQL = function(collation) {
  return this.supportsColumnCollation() ? 'COLLATE ' + collation : '';
};

/**
 * Whether the platform prefers sequences for ID generation.
 * Subclasses should override this method to return TRUE if they prefer sequences.
 *
 * @return {boolean}
 */
p.prefersSequences = function() {
  return false;
};

/**
 * Whether the platform prefers identity columns (eg. autoincrement) for ID generation.
 * Subclasses should override this method to return TRUE if they prefer identity columns.
 *
 * @return {boolean}
 */
p.prefersIdentityColumns = function() {
  return false;
};

/**
 * Some platforms need the boolean values to be converted.
 *
 * The default conversion in this implementation converts to integers (false => 0, true => 1).
 *
 * Note: if the input is not a boolean the original input might be returned.
 *
 * There are two contexts when converting booleans: Literals and Prepared Statements.
 * This method should handle the literal case
 *
 * @param {boolean|Object|Array} item A boolean or an array of them.
 *
 * @return {int|Object|Array} A boolean database value or an array of them.
 */
p.convertBooleans = function(item) {
  if (typeof item === 'object') {
    each(item, function(value, k) {
      if (typeof value === 'boolean') {
        item[k] = value ? 1 : 0;
      }
    });
  } else if (typeof item === 'boolean') {
    item = item ? 1 : 0;
  }

  return item;
};

/**
 * Some platforms have boolean literals that needs to be correctly converted
 *
 * The default conversion tries to convert value into bool "(bool)$item"
 *
 * @param {*} item
 *
 * @return bool|null
 */
p.convertFromBoolean = function(item) {
  return null === item ? null : (item ? true : false);
};

/**
 * This method should handle the prepared statements case. When there is no
 * distinction, it's OK to use the same method.
 *
 * Note: if the input is not a boolean the original input might be returned.
 *
 * @param {boolean|Object|Array} item A boolean or an array of them.
 *
 * @return {int|Object|Array} A boolean database value or an array of them.
 */
p.convertBooleansToDatabaseValue = function(item) {
  return this.convertBooleans(item);
};

/**
 * Returns the SQL specific for the platform to get the current date.
 *
 * @returns {string}
 */
p.getCurrentDateSQL = function() {
  return 'CURRENT_DATE';
};

/**
 * Returns the SQL specific for the platform to get the current time.
 *
 * @returns {string}
 */
p.getCurrentTimeSQL = function() {
  return 'CURRENT_TIME';
};

/**
 * Returns the SQL specific for the platform to get the current timestamp
 *
 * @returns {string}
 */
p.getCurrentTimestampSQL = function() {
  return 'CURRENT_TIMESTAMP';
};

/**
 * Returns the SQL for a given transaction isolation level Connection constant.
 *
 * @param {int} level
 *
 * @returns {string}
 *
 * @access protected
 *
 * @throws {InvalidArgumentException}
 */
p._getTransactionIsolationLevelSQL = function(level) {
  switch (level) {
    case Connection.TRANSACTION_READ_UNCOMMITTED:
      return 'READ UNCOMMITTED';
    case Connection.TRANSACTION_READ_COMMITTED:
      return 'READ COMMITTED';
    case Connection.TRANSACTION_REPEATABLE_READ:
      return 'REPEATABLE READ';
    case Connection.TRANSACTION_SERIALIZABLE:
      return 'SERIALIZABLE';
    default:
      throw new InvalidArgumentException('Invalid isolation level:' + level.toString());
  }
};

/**
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListDatabasesSQL = function() {
  throw DBALException.notSupported('getListDatabasesSQL');
};

/**
 * Returns the SQL statement for retrieving the namespaces defined in the database.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListNamespacesSQL = function() {
  throw DBALException.notSupported('getListNamespacesSQL');
};

/**
 * @param {string} database
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListSequencesSQL = function(database) {
  throw DBALException.notSupported('getListSequencesSQL');
};

/**
 * @param {string} table
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListTableConstraintsSQL = function(table) {
  throw DBALException.notSupported('getListTableConstraintsSQL');
};

/**
 * @param {string} table
 * @param {string} database
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListTableColumnsSQL = function(table, database) {
  throw DBALException.notSupported('getListTableColumnsSQL');
};

/**
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListTablesSQL = function() {
  throw DBALException.notSupported('getListTablesSQL');
};

/**
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListUsersSQL = function() {
  throw DBALException.notSupported('getListUsersSQL');
};

/**
 * Returns the SQL to list all views of a database or user.
 *
 * @param {string} database
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListViewsSQL = function(database) {
  throw DBALException.notSupported('getListViewsSQL');
};

/**
 * Returns the list of indexes for the current database.
 *
 * The current database parameter is optional but will always be passed
 * when using the SchemaManager API and is the database the given table is in.
 *
 * Attention: Some platforms only support currentDatabase when they
 * are connected with that database. Cross-database information schema
 * requests may be impossible.
 *
 * @param {string} table
 * @param {string} currentDatabase
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListTableIndexesSQL = function(table, currentDatabase) {
  throw DBALException.notSupported('getListTableIndexesSQL');
};

/**
 * @param {string} table
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getListTableForeignKeysSQL = function(table) {
  throw DBALException.notSupported('getListTableForeignKeysSQL');
};

/**
 * @param {string} name
 * @param {string} sql
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getCreateViewSQL = function(name, sql) {
  throw DBALException.notSupported('getCreateViewSQL');
};

/**
 * @param {string} name
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDropViewSQL = function(name) {
  throw DBALException.notSupported('getDropViewSQL');
};

/**
 * Returns the SQL snippet to drop an existing sequence.
 *
 * @param {Sequence|string} sequence
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDropSequenceSQL = function(sequence) {
  throw DBALException.notSupported('getDropSequenceSQL');
};

/**
 * @param {string} sequenceName
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getSequenceNextValSQL = function(sequenceName) {
  throw DBALException.notSupported('getSequenceNextValSQL');
};

/**
 * Returns the SQL to create a new database.
 *
 * @param {string} database The name of the database that should be created.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getCreateDatabaseSQL = function(database) {
  throw DBALException.notSupported('getCreateDatabaseSQL');
};

/**
 * Returns the SQL to set the transaction isolation level.
 *
 * @param {int} level
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getSetTransactionIsolationSQL = function(level) {
  throw DBALException.notSupported('getSetTransactionIsolationSQL');
};

/**
 * Gets the default transaction isolation level of the platform.
 *
 * @return {int} The default isolation level.
 *
 * @see Connection.TRANSACTION_* constants.
 */
p.getDefaultTransactionIsolationLevel = function() {
  return Connection.TRANSACTION_READ_COMMITTED;
};

/* supports*() methods */

/**
 * Whether the platform supports sequences.
 *
 * @return {boolean}
 */
p.supportsSequences = function() {
  return false;
};

/**
 * Whether the platform supports identity columns.
 *
 * Identity columns are columns that receive an auto-generated value from the
 * database on insert of a row.
 *
 * @return {boolean}
 */
p.supportsIdentityColumns = function() {
  return false;
};

/**
 * Whether the platform emulates identity columns through sequences.
 *
 * Some platforms that do not support identity columns natively
 * but support sequences can emulate identity columns by using
 * sequences.
 *
 * @return {boolean}
 */
p.usesSequenceEmulatedIdentityColumns = function() {
  return false;
};

/**
 * Returns the name of the sequence for a particular identity column in a particular table.
 *
 * @param {string} tableName  The name of the table to return the sequence name for.
 * @param {string} columnName The name of the identity column in the table to return the sequence name for.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 *
 * @see usesSequenceEmulatedIdentityColumns
 */
p.getIdentitySequenceName = function(tableName, columnName) {
  throw DBALException.notSupported('getIdentitySequenceName');
};

/**
 * Whether the platform supports indexes.
 *
 * @return {boolean}
 */
p.supportsIndexes = function() {
  return true;
};

/**
 * Whether the platform supports partial indexes.
 *
 * @return {boolean}
 */
p.supportsPartialIndexes = function() {
  return false;
};

/**
 * Whether the platform supports altering tables.
 *
 * @return {boolean}
 */
p.supportsAlterTable = function() {
  return true;
};

/**
 * Whether the platform supports transactions.
 *
 * @return {boolean}
 */
p.supportsTransactions = function() {
  return true;
};

/**
 * Whether the platform supports savepoints.
 *
 * @return {boolean}
 */
p.supportsSavepoints = function() {
  return true;
};

/**
 * Whether the platform supports releasing savepoints.
 *
 * @return {boolean}
 */
p.supportsReleaseSavepoints = function() {
  return this.supportsSavepoints();
};

/**
 * Whether the platform supports primary key constraints.
 *
 * @return {boolean}
 */
p.supportsPrimaryConstraints = function() {
  return true;
};

/**
 * Whether the platform supports foreign key constraints.
 *
 * @return {boolean}
 */
p.supportsForeignKeyConstraints = function() {
  return true;
};

/**
 * Whether this platform supports onUpdate in foreign key constraints.
 *
 * @return {boolean}
 */
p.supportsForeignKeyOnUpdate = function() {
  return (this.supportsForeignKeyConstraints() && true);
};

/**
 * Whether the platform supports database schemas.
 *
 * @return {boolean}
 */
p.supportsSchemas = function() {
  return false;
};

/**
 * Whether this platform can emulate schemas.
 *
 * Platforms that either support or emulate schemas don't automatically
 * filter a schema for the namespaced elements in {@link AbstractManager#createSchema}.
 *
 * @return {boolean}
 *
 * @TODO check "AbstractManager#createSchema" method is exists
 */
p.canEmulateSchemas = function() {
  return false;
};

/**
 * Returns the default schema name.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getDefaultSchemaName = function() {
  throw DBALException.notSupported('getDefaultSchemaName');
};

/**
 * Whether this platform supports create database.
 *
 * Some databases don't allow to create and drop databases at all or only with certain tools.
 *
 * @return {boolean}
 */
p.supportsCreateDropDatabase = function() {
  return true;
};

/**
 * Whether the platform supports getting the affected rows of a recent update/delete type query.
 *
 * @return {boolean}
 */
p.supportsGettingAffectedRows = function() {
  return true;
};

/**
 * Whether this platform support to add inline column comments as postfix.
 *
 * @return {boolean}
 */
p.supportsInlineColumnComments = function() {
  return false;
};

/**
 * Whether this platform support the proprietary syntax "COMMENT ON asset".
 *
 * @return {boolean}
 */
p.supportsCommentOnStatement = function() {
  return false;
};

/**
 * Does this platform have native guid type.
 *
 * @return {boolean}
 */
p.hasNativeGuidType = function() {
  return false;
};

/**
 * Does this platform have native JSON type.
 *
 * @return {boolean}
 */
p.hasNativeJsonType = function() {
  return false;
};

/**
 * Whether this platform supports views.
 *
 * @return {boolean}
 */
p.supportsViews = function() {
  return true;
};

/**
 * Does this platform support column collation?
 *
 * @return {boolean}
 */
p.supportsColumnCollation = function() {
  return false;
};

/**
 * Gets the format string, as accepted by the date() function, that describes
 * the format of a stored datetime value of this platform.
 *
 * @returns {string} The format string.
 */
p.getDateTimeFormatString = function() {
  return 'Y-m-d H:i:s';
};

/**
 * Gets the format string, as accepted by the date() function, that describes
 * the format of a stored datetime with timezone value of this platform.
 *
 * @returns {string} The format string.
 */
p.getDateTimeTzFormatString = function() {
  return 'Y-m-d H:i:s';
};

/**
 * Gets the format string, as accepted by the date() function, that describes
 * the format of a stored date value of this platform.
 *
 * @returns {string} The format string.
 */
p.getDateFormatString = function() {
  return 'Y-m-d';
};

/**
 * Gets the format string, as accepted by the date() function, that describes
 * the format of a stored time value of this platform.
 *
 * @returns {string} The format string.
 */
p.getTimeFormatString = function() {
  return 'H:i:s';
};

/**
 * Adds an driver-specific LIMIT clause to the query.
 *
 * @param {string} query
 * @param {int}    limit
 * @param {int=}   offset
 *
 * @returns {string}
 *
 * @throws {DBALException}
 */
p.modifyLimitQuery = function(query, limit, offset) {
  offset = offset != undefined ? offset : null;

  if (limit !== null) {
    limit = php.intval(limit);
  }

  if (offset !== null) {
    offset = php.intval(offset);

    if (offset < 0) {
      throw new DBALException('LIMIT argument offset=' + offset + ' is not valid');
    }

    if (offset > 0 && ! this.supportsLimitOffset()) {
      throw new DBALException('Platform ' + this.getName() +' does not support offset values in limit queries.');
    }
  }

  return this.doModifyLimitQuery(query, limit, offset);
};

/**
 * Adds an driver-specific LIMIT clause to the query.
 *
 * @param {string} query
 * @param {int}    limit
 * @param {int}    offset
 *
 * @returns {string}
 */
p.doModifyLimitQuery = function(query, limit, offset) {
  if (limit != null) {
    query += ' LIMIT ' + limit;
  }

  if (offset != null) {
    query += ' OFFSET ' + offset;
  }

  return query;
};

/**
 * Whether the database platform support offsets in modify limit clauses.
 *
 * @return {boolean}
 */
p.supportsLimitOffset = function() {
  return true;
};

/**
 * Gets the character casing of a column in an SQL result set of this platform.
 *
 * @param {string} column The column name for which to get the correct character casing.
 *
 * @returns {string} The column name in the character casing used in SQL result sets.
 */
p.getSQLResultCasing = function(column) {
  return column;
};

/**
 * Makes any fixes to a name of a schema element (table, sequence, ...) that are required
 * by restrictions of the platform, like a maximum length.
 *
 * @param {string} schemaElementName
 *
 * @returns {string}
 */
p.fixSchemaElementName =  function(schemaElementName) {
  return schemaElementName;
};

/**
 * Maximum length of any given database identifier, like tables or column names.
 *
 * @return {int}
 */
p.getMaxIdentifierLength = function() {
  return 63;
};

/**
 * Returns the insert SQL for an empty insert statement.
 *
 * @param {string} tableName
 * @param {string} identifierColumnName
 *
 * @returns {string}
 */
p.getEmptyIdentityInsertSQL = function(tableName, identifierColumnName) {
  return 'INSERT INTO ' + tableName + ' (' + identifierColumnName + ') VALUES (null)';
};

/**
 * Generates a Truncate Table SQL statement for a given table.
 *
 * Cascade is not supported on many platforms but would optionally cascade the truncate by
 * following the foreign keys.
 *
 * @param {string}  tableName
 * @param {boolean=} cascade
 *
 * @returns {string}
 */
p.getTruncateTableSQL = function(tableName, cascade) {
  cascade = cascade ? cascade : false;

  return 'TRUNCATE ' + tableName;
};

/**
 * This is for test reasons, many vendors have special requirements for dummy statements.
 *
 * @returns {string}
 */
p.getDummySelectSQL = function() {
  return 'SELECT 1';
};

/**
 * Returns the SQL to create a new savepoint.
 *
 * @param {string} savepoint
 *
 * @returns {string}
 */
p.createSavePoint = function(savepoint) {
  return 'SAVEPOINT ' + savepoint;
};

/**
 * Returns the SQL to release a savepoint.
 *
 * @param {string} savepoint
 *
 * @returns {string}
 */
p.releaseSavePoint = function(savepoint) {
  return 'RELEASE SAVEPOINT ' + savepoint;
};

/**
 * Returns the SQL to rollback a savepoint.
 *
 * @param {string} savepoint
 *
 * @returns {string}
 */
p.rollbackSavePoint = function(savepoint) {
  return 'ROLLBACK TO SAVEPOINT ' + savepoint;
};

/**
 * Returns the keyword list instance of this platform.
 *
 * @return {AbstractKeywords}
 *
 * @throws {DBALException} If no keyword list is specified.
 */
p.getReservedKeywordsList = function() {
  // Check for an existing instantiation of the keywords class.
  if (keywords_) {
    return keywords_;
  }

  var Keywords = require('./Keywords/' + this.getReservedKeywordsClass() + '.js');

  // Store the instance so it doesn't need to be generated on every request.
  keywords_ = new Keywords();

  if (keywords_ instanceof AbstractKeywords) {
    return keywords_;
  }

  throw DBALException.notSupported('getReservedKeywordsList');
};

/**
 * Returns the class name of the reserved keywords list.
 *
 * @returns {string}
 *
 * @throws {DBALException} If not supported on this platform.
 */
p.getReservedKeywordsClass = function() {
  throw DBALException.notSupported('getReservedKeywordsClass');
};

/**
 * Quotes a literal string.
 * This method is NOT meant to fix SQL injections!
 * It is only meant to escape this platform's string literal
 * quote character inside the given literal string.
 *
 * @param {string} str The literal string to be quoted.
 *
 * @returns {string} The quoted literal string.
 */
p.quoteStringLiteral = function(str) {
  var c = this.getStringLiteralQuoteCharacter();

  return c + str.replace(new RegExp(c, 'g'), c + c) + c;
};

/**
 * Gets the character used for string literal quoting.
 *
 * @returns {string}
 */
p.getStringLiteralQuoteCharacter = function() {
  return "'";
};
