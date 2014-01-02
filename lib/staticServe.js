var restify = require('restify');

var c = require('./conf').get('server');
var log = require('./log').get(module);
var session = require('./session');

var staticHandler = restify.serveStatic(c['static']);

function serve(req, res, next) {
  if (req.url === '/login' || session.check(req, res)) {
    staticHandler(req, res, next);
  }
}

exports.register = function(server) {
  // static file serving
  log.info('static conf is: ', c['static']);
  server.get(/.*/, serve);
};
