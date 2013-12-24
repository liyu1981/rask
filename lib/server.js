var util = require('util');
var restify = require('restify');

var log = require('./log').get(module);

exports.start = function() {
  var c = require('./conf').get();
  var server = restify.createServer({
    name: 'mserver',
    log: require('bunyan').createLogger(c['bunyan'])
  });

  // disable curl default keep-alive
  server.pre(restify.pre.userAgentConnection());

  // allow cross domain access
  server.pre(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    return next();
  });

  // auto parse query
  server.use(restify.queryParser());

  // auto parse body
  server.use(restify.bodyParser({ mapParams: false }));

  // enable cookie
  server.use(require('./cookie').cookieParser());

  // enable session checking
  server.use(require('./' + c['session_handler']).sessionChecker());

  // route map
  require('./route').register(server);

  // static file serving
  log.info('static conf is: ', c['static']);
  server.get(/.*/, restify.serveStatic(c['static']));

  // now fire!
  server.listen(parseInt(c['bind_port']), function() {
    log.info('%s listening at %s', server.name, server.url);
  });
}
