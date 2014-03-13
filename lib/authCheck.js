var log = require('./log').get(module);

exports.init = function(server) {
  // auto parse authorization
  server.use(require('restify').authorizationParser());
  log.info('Module authCheck inited.');
  return exports;
};

exports.getDefaultChecker = function(server, conf) {
  return function(req, res, next) {
    if (conf['auth']) {
      var a = req.authorization;
      if (a.scheme === 'Basic' && (a.basic.username in conf['auth']) &&
          a.basic.password == conf['auth'][a.basic.username]) {
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
