var WorkflowMgr = require('../lib/workflow');

var w = WorkflowMgr.newWorkflow({});

function getWORandom(split, err, callback) {
  var r = Math.random() * 100;
  console.log('rand=', r);
  if (r > split) {
    callback('D');
  } else if (r < err) {
    callback('ERR');
  } else {
    callback('C');
  }
}

w.def({
  'A': function() {
    console.log('step A');
    return 'B';
  },

  'B': function() {
    var self = this;
    console.log('step B');
    getWORandom(50, 10, function(nextStep) {
        self.goto(nextStep);
      });
  },

  'C': function() {
    console.log('step C');
    this.local.hello = 'world!';
    return 'END';
  },

  'D': function() {
    console.log('step D');
    this.local.hello = 'rask!';
    return 'END';
  }
});

w.start(function(local) {
    console.log('End', local);
  },
  function(local) {
    console.log('Error', local);
  });
