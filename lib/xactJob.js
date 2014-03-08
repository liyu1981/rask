/* XactJob enable rest api to
     GET/POST http://host/someInitRestAPI
       => return RESULT & XactJobID(e.g., 123)

     GET/POST http://host/moreRestAPI?xactJobID=123
       => return RESULT & XactJobID

     GET/POST http://host/submitRestAPI?xactJobID=123
       => submit the xact
 */
var _ = require('underscore');

var HashTable = require('hashtable');
var uuid = require('node-uuid').v4;

var log = require('./log');

var xactMap = null;

function reaper() {
  var check_period_in_seconds = 3;
  return setInterval(function() {
    var keys = xactMap.keys();
    for (var i = 0; i < keys.length; i++) {
      var v = xactMap.get(keys[i]);
      v['life'] -= check_period_in_seconds;
      if (v['life'] <= 0) {
        xactMap.remove(keys[i]);
      } else {
        xactMap.put(keys[i], v);
      }
    }
  }, check_period_in_seconds * 1000);
}

exports.init = function() {
  xactMap = new HashTable();
  exports._reaper = reaper();
};

exports.create = function(options, callback) {
  var key = uuid();
  xactMap.put(key, { life: options.life || 5 });
  callback(key);
};

exports.check = function(key, callback) {
  var v = xactMap.get(key);
  if (v) {
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
    callback(new Error('Not found xact:' + key + '.'));
  }
};

exports.finish = function(key) {
  xactMap.remove(key);
};
