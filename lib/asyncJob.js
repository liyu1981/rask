/* AsyncJob typical usage

   var j = rask.asyncJob.create('myjob', function(done) {
       // ... do your job here
       // when you finish
       done();
     });

   res.send(200, j.getTrackInfo());
 */
var util = require('util');
var _ = require('underscore');
var NeDB = require('nedb');

var log = require('./log').get(module);

var _db = null;
var _dbready = false;

exports.init = function() {
  var c = require('./conf').get('asyncJob') || {};
  _db = new NeDB({ filename: (c.filename || './var/asyncJob.db') });
  _db.loadDatabase(function(err) {
    if (err) {
      log.error(err);
      process.exit(1);
    }
    // after init, we mark all pre-exist async job as dead, since the server must restarted,
    // anything not done have no chance to finish.
    _db.update({ $not: { $and: [ { status: 'ok' }, { status: 'error' }, { status: 'timeout' } ] }},
      {
        $set: {
          status: 'error',
          result: { code: 'serverdown', message: 'fail because server was down or restarted.' }
        }
      }, {}, function() {
        // to prevent user to create some job before the db is ready, we lock it with _dbready
        // now db is ready, so we unlock it.
        _dbready = true;
      });
  });
};

function queryAsyncJob(req, res, next) {
  if (req.params['id']) {
    _db.find({ _id: req.params['id'] }, function(err, docs) {
        if (err) {
          res.send(200, err);
          return;
        }
        res.send(200, docs[0]);
      });
  } else {
    res.send(200);
  }
}

function listAsyncJob(req, res, next) {
  _db.find({}, function(err, docs) {
      if (err) {
        res.send(200, err);
        return;
      }
      res.send(200, { jobs: docs });
    });
}

exports.register = function(server) {
  server.get('/asyncJob/query', queryAsyncJob);
  server.get('/asyncJob/list', listAsyncJob);
};

function Job(name, jobFunc, options) {
  this.name = name;
  this.func = jobFunc;
  this.options = _.defaults(options, {
    timeout: 10 // in seconds
  });
}
util.inherits(Job, require('events').EventEmitter);

Job.prototype.run = function() {
  var self = this;
  _db.insert({
    name: this.name,
    status: 'pending',
    startTime: (new Date()).getTime(),
    finishTime: null,
    timeout: this.options.timeout,
    result: null,
  }, function(err, newDoc) {
    self._id = newDoc._id;
    //console.log('id assigned as:', self._id);
    self.emit('id_assigned', self._id);
    _db.update({ _id: self._id }, { $set: { status: 'running' } }, {}, function() { });
    (function() {
      var alreadyTimeout = false;
      // setup a timer for timeout update
      setTimeout(function() {
          _db.update({ _id: self._id }, { $set: { status: 'timeout' } }, {}, function() { });
          alreadyTimeout = true;
          // after this, the record is marked as 'timeout', but the user's routine may still going...
          // we can only prevent it by modifying the _db, but can do nothing about other side effects
        }, self.options.timeout * 1000);
      // setup done function for user's func
      function done(err, result) {
        if (alreadyTimeout) {
          // already timeout, do nothing
          return;
        }
        var now = (new Date()).getTime();
        if (err) {
          _db.update({ _id: self._id },
            {
              $set: {
                status: 'error',
                finishTime: now,
                result: err
              }
            }, {}, function() { });
        } else {
          _db.update({ _id: self._id },
            {
              $set: {
                status: 'ok',
                finishTime: now,
                result: result || null
              }
            }, {}, function() { });
        }
      }
      // now run the user's func
      self.func(done);
    })();
  });
};

Job.prototype.setTimeout = function(timeout) {
  this.options.timeout = timeout;
};

exports.create = function(name, jobFunc, options) {
  if (!_dbready) {
    throw new Error('db is not ready');
  } else {
    var j = new Job(name, jobFunc, options || {});
    j.run();
    return j;
  }
};

exports.isReady = function() {
  return _dbready;
};
