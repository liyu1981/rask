var util = require('util');
var assert = require('assert');

var rask = require('../lib/main.js');

var _jury = 0;
function judge(callback) {
  if (_jury === 0) {
    callback(null, 1);
  } else if (_jury > 0) {
    callback(null, 0);
  } else {
    callback('error', null);
  }
}

function getAAq(jury) {
  _jury = jury;
  var aq = rask.actionQueue.create();
  aq.push(function() {
      // simple logic
      this.next();
    });
  aq.push(function() {
      var self = this;
      judge(function(err, data) {
        if (err) {
          self.stop(err);
          return;
        }
        if (data === 1) {
          _jury = 10;
          self.goBack();
          setTimeout(function() { self.next(); }, 100);
        } else if (data === 0){
          self.next();
        }
      });
    });
  return aq;
}

function getMockOK(callback) {
  return function() {
    callback();
  };
}

function getMockErr(callback) {
  return function(err) {
    callback(err);
  };
}

describe('actionQueue', function() {
  describe('testNormal', function() {
    it('should finish without exception.', function(donedone) {
      var aq = getAAq(10);
      assert(2, aq.total());
      assert(true, aq.finished());
      assert('0%', aq.finishedPercentage());
      aq.run({
        done: getMockOK(function() {
          donedone();
        }),
        stop: null
      });
    });
  });

  describe('testGoBack', function() {
    it('should finish without exception.', function(donedone) {
      var aq = getAAq(0);
      aq.run({
        done: getMockOK(function() {
          donedone();
        }),
        stop: null
      });
    });
  });

  describe('testErr', function() {
    it('should finish without exception.', function(done) {
      var aq = getAAq(-10);
      aq.run({
        done: null,
        stop: getMockErr(function(err) {
          assert(2, aq.total());
          assert(1, aq.finished());
          assert('50%', aq.finishedPercentage());
          // got the err
          if (err === 'error') {
            done();
          } else {
            throw 'wired error got: ' + err;
          }
        })
      });
    });
  });

  describe('testEmpty', function() {
    it('should finish without exception.', function(donedone) {
      var aq = rask.actionQueue.create();
      aq.run({
        done: getMockOK(function() {
          donedone();
        }),
        stop: null
      });
    });
  });

});
