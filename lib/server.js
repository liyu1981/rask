var _ = require('underscore');
var log = require('./log').get(module);

module.exports = function(options) {
  var opt = _.defaults(options || {}, {
    name: 'restapp',
    serveStatic: false,
    allowCrossDomain: true,
    allowParseQuery: true,
    allowParseBody: true,
    enableCookie: true
  });
  var rr = null;
  return {
    options: opt,
    route: function(routeRegister) {
        rr = routeRegister;
        return this;
      },
    start: function(serverConf) {
        var restify = require('restify');
        var c = _.extend(require('./conf').get(), serverConf);
        var server = restify.createServer({
          name: this.options['name'],
          log: require('bunyan').createLogger(c['bunyan'])
        });
        this._server = server;

        // disable curl default keep-alive
        server.pre(restify.pre.userAgentConnection());

        // allow cross domain access
        if (this.options['allowCrossDomain']) {
          server.pre(function(req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            return next();
          });
        }

        // auto parse query
        if (this.options['allowParseQuery']) {
          server.use(restify.queryParser());
        }

        // auto parse body
        if (this.options['allowParseBody']) {
          server.use(restify.bodyParser({ mapParams: false }));
        }

        // enable cookie
        if (this.options['enableCookie']) {
          server.use(require('./cookie').cookieParser());
        }

        // route map
        if (rr) {
          rr(server);
          rr = null;
        }

        // serve static
        if (this.options['serveStatic']) {
          if (_.isFunction(this.options['serveStatic'])) {
            require('./serveStatic').register(server, this.options['serveStatic']);
          } else {
            require('./serveStatic').register(server);
          }
        }

        // copy from restify source, for better uncaughtException reporting
        server.on('uncaughtException', function (req, res, route, e) {
          log.error('uncaughtException:');
          log.error('  route=', route);
          log.error('  err=', e);
          res.send({ errno: 'InternalError', message: e.message });
          return true;
        });

        // now fire!
        server.listen(parseInt(c['bind_port']) || 12345, function() {
          log.info('%s listening at %s', server.name, server.url);
        });

        return this;
      }
  };
};
