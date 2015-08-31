var DBALException = require('../../lib/Exception/DBALException.js');

describe('Exception/DBALException', function() {
  describe('notSupported', function() {
    it('should match correct error messages', function() {
      var error = DBALException.notSupported('foobar')
        , message = error.toString();

      error.should.instanceof(Error);
      message.should.equal('DBALException: Operation "foobar" is not supported by platform.');
    });
  });
});
