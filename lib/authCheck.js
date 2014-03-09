var _ = require('underscore');
var restify = require('restify');

exports.init = function(server) {
    // auto parse authorization
    server.use(restify.authorizationParser());
};

exports.getDefaultChecker = function(conf) {
  return function(req, res, next) {
    if (conf['auth']) {
      var a = req.authorization;
      if (a.scheme === 'Basic' && (a.basic.username in c['auth']) &&
          a.basic.password == c['auth'][a.basic.username]) {
        next();
      } else {
        res.header('WWW-Authenticate', 'Basic realm="' + server.name  + '"');
        res.send(401, 'Not Authorized.');
      }
    } else {
      next(); // no auth conf, just let it pass
    }
  };
};
