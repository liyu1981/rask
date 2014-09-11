var HashTable = require('hashtable');

var log = require('./log').get(module);

var failRedirect = function (res) {
  var c = require('./conf').get('session');
  if (c['fail_redirect']) {
    res.writeHead(302, { 'Location': c['fail_redirect'] });
    res.end();
  } else {
    res.writeHead(401, 'Unauthorized.');
    res.end();
  }
}

exports.setFailRedirect = function(f) {
  failRedirect = f;
};

var sessionMap = null;

exports.size = function() {
  return sessionMap.size();
};

function checkMap(key) {
  if (sessionMap === null) {
    // user must have turn global session support down, so no session check at all
    return true;
  }
  log.debug('check session:', key);
  var v = sessionMap.get(key);
  if (key && v) {
    log.debug('session found:', key);
    // extend session if check is OK.
    v['life'] = v['maxLife'];
    sessionMap.put(key, v);
    log.debug('session updated:', key);
    return true;
  } else {
    log.debug('session not found:', key);
    return false;
  }
}

exports.findSession = function(k) {
  return sessionMap.get(k);
};

exports.setSessionMap = function(m) {
  // a map object confirms to the HashTable interfaces
  // check the interfaces at https://www.npmjs.org/package/hashtable
  sessionMap = m;
};

var genRandomSession = function () {
  return require('node-uuid').v4();
};

exports.setGenRandomSession = function(f) {
  genRandomSession = f;
};

function reaper() {
  var checkPeriodInSeconds = require('./conf').get('session')['check_period_in_seconds'];
  return setInterval(function() {
    var keys = sessionMap.keys();
    for (var i = 0; i < keys.length; i++) {
      var v = sessionMap.get(keys[i]);
      v['life'] -= checkPeriodInSeconds;
      if (v['life'] <= 0) {
        sessionMap.remove(keys[i]);
        log.info('session:' + keys[i] + ' timeout.');
      } else {
        sessionMap.put(keys[i], v);
      }
    }
  }, checkPeriodInSeconds * 1000);
};

function checkConf() {
  var c = require('./conf');
  if (!c.has('session')) {
    log.info('No custom session conf, will use default conf.');
    c.merge('session', {
      'session_name': 'rask-session',
      'default_session_lifetime_in_seconds': 7200,
      'check_period_in_seconds': 60,
      'fail_redirect': '/login'
    });
  }
}

// This is a slow naive js implementation of sessionMap storage.
// Only use it for demo of how to write your session storage or debug.
function SlowMap() {
  this._m = {};
}

SlowMap.prototype.get = function(k) {
  return (k in this._m) ? this._m[k] : null;
};

SlowMap.prototype.put = function(k, v) {
  this._m[k] = v;
};

SlowMap.prototype.remove = function(k) {
  if (k in this._m) {
    delete this._m[k];
  }
};

SlowMap.prototype.keys = function() {
  return Object.keys(this._m);
};
// SlowMap end

exports.init = function() {
  checkConf();
  log.info('session module inited.');
  sessionMap = new HashTable();
  //sessionMap = new SlowMap();
  exports._reaper = reaper();
};

exports.check = function(req, res) {
  var c = require('./conf').get('session');
  var s = req.headers.cookie[c['session_name']];
  if (checkMap(s)) {
    return true;
  }
  c['fail_redirect'] && failRedirect(res);
  return false;
};

exports.createSession = function(res, option) {
  var c = require('./conf').get('session');
  var opt = option || {};
  var k = opt.sessionKey || genRandomSession();
  if (!opt.path) { opt.path = '/'; }
  log.info('create session:', opt);
  res.setHeader('Set-Cookie', require('./cookie').serialize(c['session_name'], k, option));
  var ml = (option && option.maxLife) || c['default_session_lifetime_in_seconds'];
  sessionMap.put(k, { life: ml, maxLife: ml });
};

exports.removeSession = function(req, res) {
  var c = require('./conf').get('session');
  var cookie = require('./cookie');
  if (req.headers['cookie']) {
    var cmap = req.headers['cookie'];
    if (c['session_name'] in cmap) {
      sessionMap.remove(cmap[c['session_name']]);
      log.info('session:' + cmap[c['session_name']] + 'removed.');
    }
  }
  res.setHeader('Set-Cookie', cookie.serialize(c['session_name'], ''));
};
