require('../lib/main.js');
var assert = require('assert');

describe('common', function() {
  describe('testStack', function() {
    it('should match the right line number without error', function() {
      assert(7, __line);
    });
  });
});
