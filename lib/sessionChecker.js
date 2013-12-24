var HashTable = require('hashtable');

var c = require('./conf').get('sessionChecker');

function _failRedirect(res) {
  if (c['fail_redirect']) {
    res.writeHead(302, { 'Location': c['fail_redirect'] });
    res.end();
  } else {
    res.writeHead(401, 'Unauthorized.');
    res.end();
  }
}

var _sessionMap = new HashTable();

function _check(key) {
  if (key && _sessionMap.get(key)) {
    // extend session if check is OK.
    var v = _sessionMap.get(key);
    v['life'] = v['maxLife'];
    _sessionMap.put(key, v);
    return true;
  } else {
    return false;
  }
}
function _genRandomSession() {
  return require('node-uuid').v4();
}

exports._checker = setInterval(function() {
  var keys = _sessionMap.keys();
  for (var i = 0; i < keys.length; i++) {
    var v = _sessionMap.get(keys[i]);
    v['life'] -= c['check_period_in_seconds'];
    if (v['life'] <= 0) {
      _sessionMap.remove(keys[i]);
    } else {
      _sessionMap.put(keys[i], v);
    }
  }
}, c['check_period_in_seconds']);

exports.sessionChecker = function(callback) {
  return function(req, res, next) {
    if (req.url.indexOf(c['login_endpoint']) === 0) {
      // url started with login_endpoint is waived
      next();
      return;
    }
    console.log('cookie', req.headers.cookie);
    if (_check(req.headers.cookie[c['session_name']])) {
      next();
      return;
    }
    callback && callback();
    c['fail_redirect'] && _failRedirect(res);
  };
};

exports.createSession = function(res, option) {
  var v = _genRandomSession();
  res.setHeader('Set-Cookie',
    require('./cookie').serialize(c['session_name'], v, option));
  _sessionMap.put(v, {
    life:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds'],
    maxLife:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds']
  });
};
