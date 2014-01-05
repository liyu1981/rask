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

  // route map
  require('./apiServe').register(server);
  require('./staticServe').register(server);

  // copy from restify source, for better uncaughtException reporting
  server.on('uncaughtException', function (req, res, route, e) {
    log.error('uncaughtException:');
    log.error('  route=', route);
    log.error('  err=', e);
    res.send({ errno: 'InternalError', message: e.message });
    return true;
  });

  // now fire!
  server.listen(parseInt(c['bind_port']), function() {
    log.info('%s listening at %s', server.name, server.url);
  });
};
