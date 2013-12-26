var HashTable = require('hashtable');

var c = require('./conf').get('sessionChecker');

function failRedirect(res) {
  if (c['fail_redirect']) {
    res.writeHead(302, { 'Location': c['fail_redirect'] });
    res.end();
  } else {
    res.writeHead(401, 'Unauthorized.');
    res.end();
  }
}

var sessionMap = new HashTable();

function check(key) {
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
function genRandomSession() {
  return require('node-uuid').v4();
}

exports._checker = setInterval(function() {
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

exports.sessionChecker = function(callback) {
  return function(req, res, next) {
    if (req.url === c['login_endpoint']) {
      // url login_endpoint is waived
      next();
      return;
    }
    if (check(req.headers.cookie[c['session_name']])) {
      next();
      return;
    }
    callback && callback();
    c['fail_redirect'] && failRedirect(res);
  };
};

exports.createSession = function(res, option) {
  var v = genRandomSession();
  res.setHeader('Set-Cookie',
    require('./cookie').serialize(c['session_name'], v, option));
  sessionMap.put(v, {
    life:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds'],
    maxLife:
      (option && option.maxLife) || c['default_session_lifetime_in_seconds']
  });
};
