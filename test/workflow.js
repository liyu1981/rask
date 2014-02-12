var util = require('util');
var assert = require('assert');

var WorkflowMgr = require('../lib/workflow');

var _output = '';

function output() {
  _output += util.format.apply(null, arguments);
}

function getMockOK(callback) {
  return function(local) {
    callback(local);
  };
}

function getMockErr(callback) {
  return function(local) {
    callback(local);
  };
}

function judge(jury, callback) {
  if (jury > 50) {
    callback('D');
  } else if (jury < 10) {
    callback('ERR');
  } else {
    callback('C');
  }
}

function getAWorkflow(jury) {
  _output = '';
  var w = WorkflowMgr.newWorkflow({});
  w.def({
    'A': function() {
      output('A');
      return 'B';
    },

    'B': function() {
      var self = this;
      output('B');
      judge(jury, function(nextStep) {
          self.goto(nextStep);
        });
    },

    'C': function() {
      output('C');
      this.local.hello = 'world!';
      return 'END';
    },

    'D': function() {
      output('D');
      this.local.hello = 'rask!';
      return 'END';
    }
  });
  return w;
}

describe('workflow', function() {
  describe('testEND1', function() {
    it('should finish without error.', function(done) {
      var w = getAWorkflow(30);
      w.start(getMockOK(function(local) {
        if (_output === 'ABC' && local.hello === 'world!') {
          done();
        } else {
          throw util.format('wrong results: %s, %j', _output, local);
        }
      }));
    });
  });

  describe('testEND2', function() {
    it('should finish without error.', function(done) {
      var w = getAWorkflow(70);
      w.start(getMockOK(function(local) {
        if (_output === 'ABD' && local.hello === 'rask!') {
          done();
        } else {
          throw util.format('wrong results: %s, %j', _output, local);
        }
      }));
    });
  });

  describe('testERR', function() {
    it('should finish with calling err handler.', function(done) {
      var w = getAWorkflow(7);
      w.start(null, getMockErr(function(local) {
        done();
      }));
    });
  });

  describe('testDeregister', function() {
    it('should finish without error.', function(done) {
      var w = getAWorkflow(7);
      w.start(null, getMockErr(function(local) {
        WorkflowMgr.deregister(w.meta._uuid);
        done();
      }));
    })
  });

  describe('testNULL', function() {
    it('should finish without error.', function(done) {
      var w = WorkflowMgr.newWorkflow();
      w.def({});
      w.start(getMockOK(function(local) {
        done();
      }));
    });
  });

  describe('testWrongState', function() {
    it('should finish without error.', function(done) {
      var w = WorkflowMgr.newWorkflow();
      w.def({
        'A': function() {
          return 'B';
        }
      });
      w.on('wrong_state', function(err) {
        // got the wrong state event
        done();
      });
      w.start();
    });
  });

  describe('testReap', function() {
    it('should finish without error.', function() {
      assert(4, WorkflowMgr.reap());
    });
  });
});
