/* XactJob enable rest api to
     GET/POST http://host/someInitRestAPI
       => return RESULT & XactJobID(e.g., 123)

     GET/POST http://host/moreRestAPI?xactJobID=123
       => return RESULT & XactJobID

     GET/POST http://host/submitRestAPI?xactJobID=123
       => submit the xact

   Example usage:

      server.get('/ajob/create', function(req, res, next) {
        rask.xactJob.create({}, function(key) {
          res.send(200, { jobId: key });
        });
      });
      server.get('/ajob/hello', function(req, res, next) {
        var key = req.params['jobId'];
        rask.xactJob.check(key, function(err, key) {
          if (err) {
            res.send(500, { err: err });
            return;
          }
          rask.xactJob.store(key, { hello: 'world' }, function(err) {
            if (err) {
              res.send(500, { err: err });
              return;
            }
            res.send(200);
          });
        });
      });
      server.get('/ajob/finish', function(req, res, next) {
        var key = req.params['jobId'];
        rask.xactJob.check(key, function(err) {
          if (err) {
            res.send(500, { err: err });
            return;
          }
          rask.xactJob.finish(key);
          res.send(200);
        });
      });
 */
var _ = require('underscore');

var HashTable = require('hashtable');
var uuid = require('node-uuid').v4;

var log = require('./log').get(module);

var xactMap = null;

function reaper() {
  var checkPeriodInSeconds = require('./conf').get('xactJob')['check_period_in_seconds'];
  return setInterval(function() {
    var keys = xactMap.keys();
    for (var i = 0; i < keys.length; i++) {
      var v = xactMap.get(keys[i]);
      v['life'] -= checkPeriodInSeconds;
      if (v['life'] <= 0) {
        log.info('xact:' + keys[i] + ' timeout.');
        xactMap.remove(keys[i]);
      } else {
        xactMap.put(keys[i], v);
      }
    }
  }, checkPeriodInSeconds * 1000);
}

function checkConf() {
  var c = require('./conf');
  if (!c.has('xactJob')) {
    log.info('No custom xactJob conf, will use default conf.');
    c.merge('xactJob', {
      'check_period_in_seconds': 3,
      'default_max_life': 5
    });
  }
}

exports.init = function() {
  checkConf();
  log.info('xactJob module inited.');
  xactMap = new HashTable();
  exports._reaper = reaper();
  return exports;
};

exports.create = function(options, callback) {
  var key = uuid();
  var maxLife = options.maxLife || 5;
  xactMap.put(key, { life: maxLife, maxLife: maxLife });
  log.info('xact:' + key + ' created.');
  callback(key);
};

exports.check = function(key, callback) {
  var v = xactMap.get(key);
  if (v) {
    v.life = v.maxLife; // restore life when accessed
    xactMap.put(key, v);
    callback(null, key);
  } else {
    callback(new Error('Not found xact:' + key + ' , probably timeout.'), null);
  }
};

exports.store = function(key, data, callback) {
  var v = xactMap.get(key);
  if (v) {
    v.data = _.extend(v.data || {}, data);
    xactMap.put(key, v);
    callback(null);
  } else {
    callback(new Error('Not found xact:' + key + ' , probably timeout.'));
  }
};

exports.finish = function(key) {
  log.info('xact:' + key + ' finished.');
  xactMap.remove(key);
};
