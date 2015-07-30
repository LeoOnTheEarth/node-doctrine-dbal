module.exports = TypeFactory;

var AbstractTypeFactory = require('../AbstractTypeFactory.js')
  , inherits = require('util').inherits;

/**
 * Class TypeFactory
 * @constructor
 */
function TypeFactory() {}

inherits(TypeFactory, AbstractTypeFactory);

// Declare column types
TypeFactory.INT        = 'Int';
TypeFactory.TINYINT    = 'TinyInt';
TypeFactory.SMALLINT   = 'SmallInt';
TypeFactory.MEDIUMINT  = 'MediumInt';
TypeFactory.BIGINT     = 'BigInt';
TypeFactory.FLOAT      = 'Float';
TypeFactory.DOUBLE     = 'Double';
TypeFactory.DECIMAL    = 'Decimal';
TypeFactory.BIT        = 'Bit';
TypeFactory.CHAR       = 'Char';
TypeFactory.VARCHAR    = 'VarChar';
TypeFactory.TEXT       = 'Text';
TypeFactory.TINYTEXT   = 'TinyText';
TypeFactory.MEDIUMTEXT = 'MediumText';
TypeFactory.LONGTEXT   = 'LongText';
TypeFactory.BLOB       = 'Blob';
TypeFactory.TINYBLOB   = 'TinyBlob';
TypeFactory.MEDIUMBLOB = 'MediumBlob';
TypeFactory.LONGBLOB   = 'LongBlob';
TypeFactory.DATE       = 'Date';
TypeFactory.TIME       = 'Time';
TypeFactory.DATETIME   = 'Datetime';
TypeFactory.TIMESTAMP  = 'Timestamp';
TypeFactory.ENUM       = 'Enum';
TypeFactory.SET        = 'Set';

/** {@inheritdoc} */
TypeFactory.getType = function(type) {
  return new (getTypeClass(type))();
};

/**
 * Require Type class declaration
 *
 * @param {string} type Type name
 *
 * @returns {Object}
 *
 * @private
 */
function getTypeClass(type)
{
  type = type.toString();

  switch (type) {
    case TypeFactory.INT:        return require('./IntType.js');
    case TypeFactory.TINYINT:    return require('./TinyIntType.js');
    case TypeFactory.SMALLINT:   return require('./SmallIntType.js');
    case TypeFactory.MEDIUMINT:  return require('./MediumIntType.js');
    case TypeFactory.BIGINT:     return require('./BigIntType.js');
    case TypeFactory.FLOAT:      return require('./FloatType.js');
    case TypeFactory.DOUBLE:     return require('./DoubleType.js');
    case TypeFactory.DECIMAL:    return require('./DecimalType.js');
    case TypeFactory.BIT:        return require('./BitType.js');
    case TypeFactory.CHAR:       return require('./CharType.js');
    case TypeFactory.VARCHAR:    return require('./VarCharType.js');
    case TypeFactory.TEXT:       return require('./TextType.js');
    case TypeFactory.TINYTEXT:   return require('./TinyTextType.js');
    case TypeFactory.MEDIUMTEXT: return require('./MediumTextType.js');
    case TypeFactory.LONGTEXT:   return require('./LongTextType.js');
    case TypeFactory.BLOB:       return require('./BlobType.js');
    case TypeFactory.TINYBLOB:   return require('./TinyBlobType.js');
    case TypeFactory.MEDIUMBLOB: return require('./MediumBlobType.js');
    case TypeFactory.LONGBLOB:   return require('./LongBlobType.js');
    case TypeFactory.DATE:       return require('./DateType.js');
    case TypeFactory.TIME:       return require('./TimeType.js');
    case TypeFactory.DATETIME:   return require('./DatetimeType.js');
    case TypeFactory.TIMESTAMP:  return require('./TimestampType.js');
    case TypeFactory.ENUM:       return require('./EnumType.js');
    case TypeFactory.SET:        return require('./SetType.js');
  }

  throw new Error('invalid type name: "' + type +'"');
}
