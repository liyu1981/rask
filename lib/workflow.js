/* Workflow.js provides AutoFSM(Finite State Machine) class and the manager.
   It is useful when you need to implement some long-time running tasks.

     workflow creatioin & run:
       var HttpOK = function(local) {
         (!local.httpStatus) && (local.httpStatus = 200);
         local.res.send(local.httpStatus, local.httpBody);
       };

       var HttpErr = function(local) {
         (!local.httpStatus) && (local.httpStatus = 500);
         local.res.send(local.httpStatus, local.err);
       };

       var w = rask.workflow.newWorkflow({ req: req, res: res });
       w.def({
         'CHECK_PARAMS': function() {
             this.local.params = // check params ...
             return 'DO_SOMETHING';
         },
         'DO_SOMETHING': function() {
           // logic, logic, logic
           var self = this;
           ..., function callback(err, data) {
             if (err) {
               self.goto('ERR');
               return;
             }
             // deal with data
             self.goto('RETRESULT');
           });
         },
         'RETURN_RESULT': function() {
           this.local.httpBody = // filtering ...
           return 'END';
         }
       });
       w.start(function(local) { // for END callback
           (!local.httpStatus) && (local.httpStatus = 200);
           local.res.send(local.httpStatus, local.httpBody);
         },
         function(local) { // for ERR callback
           (!local.httpStatus) && (local.httpStatus = 500);
           local.res.send(local.httpStatus, local.err);
         });
*/

var util = require('util');

var _ = require('underscore');
var log = require('./log').get(module);

function Workflow(localData, id) {
  this.local = _.extend({}, localData);
  this.meta = {
    _uuid: require('node-uuid').v1(),
    _beginTime: (new Date()).getTime()
  };
  id && (this.meta._id = id);
  this.states = {};
  this.curState = 'NULL';
  this.cbs = {};
}
util.inherits(Workflow, require('events').EventEmitter);

Workflow.prototype.def = function(defs) {
  var self = this;
  var thedefs = _.defaults(defs, {
    'END': function() {
        self.cbs.okCb && self.cbs.okCb(self.local);
        self.emit('end');
      },
    'ERR': function() {
        self.cbs.errCb && self.cbs.errCb(self.local);
        self.emit('err');
      }
  });
  for (var k in defs) {
    if (defs.hasOwnProperty(k)) {
      if (this.curState === 'NULL') {
        // if empty defs given, thedefs will be { 'END':..., 'ERR':... }, so the
        // curState will be 'END', remember that!
        //log.debug(util.format('wf:%s, set start state: %s', this.meta._uuid, k));
        this.curState = k;
      }
      //log.debug(util.format('wf:%s, add state: %s', this.meta._uuid, k));
      this.states[k] = defs[k].bind(this);
    }
  }
};

Workflow.prototype.goto = function(state) {
  var self = this;
  if (state in this.states) {
    if (this.states[state]) {
      process.nextTick(function() {
        var oldState = self.curState;
        self.curState = state;
        self.emit('state_change', oldState, state);
        var ret = self.states[state]();
        if (ret) { self.goto(ret); }
      });
    }
  } else {
    this.emit('wrong_state', state);
  }
};

Workflow.prototype.start = function(okCb, errCb) {
  okCb && (this.cbs.okCb = okCb);
  errCb && (this.cbs.errCb = errCb);
  if (this.curState === 'END') {
    this.states['END']();
  } else {
    this.emit('state_change', 'NULL', this.curState);
    var ret = this.states[this.curState]();
    if (ret) { this.goto(ret); }
  }
};

exports.newWorkflow = function(localData, id) {
  return new Workflow(localData, id);
};
