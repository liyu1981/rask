var c = require('./conf').get('server');
var log = require('./log').get(module);

exports.register = function(server, serveFuncGenerator) {
  // static file serving
  log.info('static conf is: ', c['static']);
  if (serveFuncGenerator) {
    var staticHandler = c['static'] ? require('restify').serveStatic(c['static']) : null;
    serveFuncGenerator(staticHandler)(server);
  } else {
    var f = (function() {
      var staticHandler = require('restify').serveStatic(c['static']);
      var session = require('./session');
      return function(req, res, next) {
        if (req.url === '/login' || session.check(req, res)) {
          staticHandler(req, res, next);
        }
      };
    })();
    server.get(/.*/, f);
    server.post(/.*/, f);
  }
};
