var Index = require('../../lib/Schema/Index.js');

/**
 * @param {boolean=}   unique
 * @param {boolean=}   primary
 * @param {Object=} options
 *
 * @returns {Index}
 */
function createIndex(unique, primary, options) {
  unique = !!unique;
  primary = !!primary;
  options = options ? options : {};

  return new Index('foo', ['bar', 'baz'], unique, primary, [], options);
}

describe('Schema/Index', function() {
  describe('test create Index', function() {
    it('should be expected Index instance', function() {
      var index = createIndex();
      var columns = index.getColumns();

      index.getName().should.equal('foo');
      columns.length.should.equal(2);
      columns.should.eql(['bar', 'baz']);
      index.isUnique().should.equal(false);
      index.isPrimary().should.equal(false);
    });
  });

  describe('test create primary', function() {
    it('should return expected primary / unique values (both of them are true)', function() {
      var index = createIndex(false, true);

      index.isUnique().should.equal(true);
      index.isPrimary().should.equal(true);
    });
  });

  describe('test create unique', function() {
    it('should return expected primary / unique values', function() {
      var index = createIndex(true, false);

      index.isUnique().should.equal(true);
      index.isPrimary().should.equal(false);
    });
  });

  describe('test fullfilled by unique', function() {
    it('should be the correct fullfiled behavior', function() {
      var index1 = createIndex(true, false);
      var index2 = createIndex(true, false);
      var index3 = createIndex();

      index1.isFullfilledBy(index2).should.equal(true);
      index1.isFullfilledBy(index3).should.equal(false);
    });
  });

  describe('test fullfilled by primary', function() {
    it('should be the correct fullfiled behavior', function() {
      var index1 = createIndex(true, true);
      var index2 = createIndex(true, true);
      var index3 = createIndex(true, false);

      index1.isFullfilledBy(index2).should.equal(true);
      index1.isFullfilledBy(index3).should.equal(false);
    });
  });

  describe('test fullfilled by index', function() {
    it('should be the correct fullfiled behavior', function() {
      var index1 = createIndex();
      var index2 = createIndex();
      var primary = createIndex(true, true);
      var unique = createIndex(true);

      index1.isFullfilledBy(index2).should.equal(true);
      index1.isFullfilledBy(primary).should.equal(true);
      index1.isFullfilledBy(unique).should.equal(true);
    });
  });

  describe('test fullfilled with partial', function() {
    it('should be the correct fullfiled behavior', function() {
      var without = new Index('without', ['col1', 'col2'], true, false, [], {});
      var partial = new Index('partial', ['col1', 'col2'], true, false, [], {"where": 'col1 IS NULL'});
      var another = new Index('another', ['col1', 'col2'], true, false, [], {"where": 'col1 IS NULL'});

      partial.isFullfilledBy(without).should.equal(false);
      without.isFullfilledBy(partial).should.equal(false);

      partial.isFullfilledBy(partial).should.equal(true);

      partial.isFullfilledBy(another).should.equal(true);
      another.isFullfilledBy(partial).should.equal(true);
    });
  });

  describe('test overrule with partial', function() {
    it('should be the correct overrule behavior', function() {
      var without = new Index('without', ['col1', 'col2'], true, false, [], {});
      var partial = new Index('partial', ['col1', 'col2'], true, false, [], {"where": 'col1 IS NULL'});
      var another = new Index('another', ['col1', 'col2'], true, false, [], {"where": 'col1 IS NULL'});

      partial.overrules(without).should.equal(false);
      without.overrules(partial).should.equal(false);

      partial.overrules(partial).should.equal(true);

      partial.overrules(another).should.equal(true);
      another.overrules(partial).should.equal(true);
    });
  });

  describe('test flags', function() {
    it('should be the expected value with flags', function() {
      var index = createIndex();

      index.hasFlag('clustered').should.equal(false);
      index.getFlags().length.should.equal(0);

      index.addFlag('clustered');

      index.hasFlag('clustered').should.equal(true);
      index.hasFlag('CLUSTERED').should.equal(true);
      index.getFlags().should.eql(['clustered']);

      index.removeFlag('clustered');

      index.hasFlag('clustered').should.equal(false);
      index.getFlags().length.should.equal(0);
    });
  });

  describe('test index quotes', function() {
    it('should be the expected value with quotes', function() {
      var index = new Index('foo', ['`bar`', '`baz`']);

      index.spansColumns(['bar', 'baz']).should.equal(true);
      index.hasColumnAtPosition('bar', 0).should.equal(true);
      index.hasColumnAtPosition('baz', 1).should.equal(true);

      index.hasColumnAtPosition('bar', 1).should.equal(false);
      index.hasColumnAtPosition('baz', 0).should.equal(false);
    });
  });

  describe('test options', function() {
    it('should be the expected value with options', function() {
      var index = createIndex();
      var index2 = createIndex(false, false, {"where": 'name IS NULL'});

      index.hasOption('where').should.equal(false);
      Object.keys(index.getOptions()).length.should.equal(0);

      index2.hasOption('where').should.equal(true);
      index2.hasOption('WHERE').should.equal(true);
      index2.getOption('where').should.equal('name IS NULL');
      index2.getOption('WHERE').should.equal('name IS NULL');
      index2.getOptions().should.eql({"where": 'name IS NULL'});
    });
  });
});
