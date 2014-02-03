var restify = require('restify');

var c = require('./conf').get('server');
var log = require('./log').get(module);
var session = require('./session');

var staticHandler = restify.serveStatic(c['static']);

function defaultServeFunc(req, res, next) {
  if (req.url === '/login' || session.check(req, res)) {
    staticHandler(req, res, next);
  }
}

exports.register = function(server, serveFunc) {
  // static file serving
  log.info('static conf is: ', c['static']);
  server.get(/.*/, serveFunc || defaultServeFunc);
};
