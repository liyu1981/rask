var HashTable = require('hashtable');

var c = require('./conf').get('session');

var failRedirect = function (res) {
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

var sessionMap = new HashTable();

exports.size = function() {
  return sessionMap.size();
};

function checkMap(key) {
  var v = sessionMap.get(key);
  if (key && v) {
    // extend session if check is OK.
    v['life'] = v['maxLife'];
    sessionMap.put(key, v);
    return true;
  } else {
    return false;
  }
}

exports.setSessionMap = function(m) {
  sessionMap = m;
};

var genRandomSession = function () {
  return require('node-uuid').v4();
};

exports.setGenRandomSession = function(f) {
  genRandomSession = f;
};

exports._reaper = setInterval(function() {
  var keys = sessionMap.keys();
  for (var i = 0; i < keys.length; i++) {
    var v = sessionMap.get(keys[i]);
    v['life'] -= c['check_period_in_seconds'];
    if (v['life'] <= 0) {
      sessionMap.remove(keys[i]);
    } else {
      sessionMap.put(keys[i], v);
    }
  }
}, c['check_period_in_seconds'] * 1000);

exports.check = function(req, res) {
  if (checkMap(req.headers.cookie[c['session_name']])) {
    return true;
  }
  c['fail_redirect'] && failRedirect(res);
  return false;
};

exports.createSession = function(res, option) {
  var k = genRandomSession();
  res.setHeader('Set-Cookie',
    require('./cookie').serialize(c['session_name'], k, option));
  sessionMap.put(k, {
    life:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds'],
    maxLife:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds']
  });
};
