var util = require('util');
var _ = require('underscore');
var log = require('./log').get(module);

function Server(opt) {
  this.options = opt || {};
  this.preRouteHooks = [];
}
util.inherits(Server, require('events').EventEmitter);

Server.prototype.addPreRouteHook = function(f) {
  this.preRouteHooks.push(f);
  return this;
};

Server.prototype.route = function(routeRegister) {
  this.rr = routeRegister;
  return this;
};

Server.prototype.wsRoute = function(routeRegister) {
  this.wsrr = routeRegister;
  return this;
};

function checkConf() {
  var c = require('./conf');
  if (!c.has('server')) {
    log.info('No custom server conf found, will use default conf.');
    c.merge('server', {
      'bind_port': 12345,
      'bunyan': {
        'name': 'base-server',
        'streams': [
          {
          'level': 'error',
          'path': './log/base-server-error.log'
          }
        ]
      },
      'static': {
        'default': 'index.html',
        'directory': './static'
      }
    });
  }
}

Server.prototype.start = function(serverConf) {
  checkConf();

  var restify = require('restify');
  var c = _.extend(require('./conf').get(), serverConf);
  var server = restify.createServer({
    name: c['name'] || 'raskapp',
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

  // enable auth check
  if (this.options['enableAuthCheck']) {
    var ac = require('./authCheck');
    ac.init(server);
    if (_.isFunction(this.options['enableAuthCheck'])) {
      server.use(this.options['enableAuthCheck']);
    } else {
      server.use(ac.getDefaultChecker(c));
    }
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

  if (this.options['enableSession']) {
    require('./session').init();
  }

  // enable preRouteHooks
  if (this.preRouteHooks.length > 0) {
    this.preRouteHooks.forEach(function(f) {
        server.use(f);
      });
  }

  // route map
  if (this.rr) {
    this.rr(server);
    this.rr = null;
  }

  // enable async job support
  if (this.options['enableAsyncJob']) {
    require('./asyncJob').init().register(server);
  }

  // enable xact job support
  if (this.options['enableXactJob']) {
    require('./xactJob').init();
  }

  // gzip
  if (this.options['enableGzip']) {
    server.use(restify.gzipResponse());
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
    res.send(200, { errno: 'InternalError', message: e.message });
    return true;
  });

  if (c['bind_port'] === 'random') {
    this._bind_port = Math.floor((Math.random() * 60000) + 1);
  }

  // now fire!
  server.listen(this._bind_port || parseInt(c['bind_port']) || 12345, function() {
    log.info('%s listening at %s', server.name, server.url);
  });

  // WebSocket
  if (this.options['enableWebSocket']) {
    this._wsServer = new (require('ws').Server)({server: this._server});
    if (this.wsrr) {
      this.wsrr(this._wsServer);
      this.wsrr = null;
    }
  }

  return this;
};

Server.prototype.stop = function(callback) {
  this._server.close(callback);
};

module.exports = function(options) {
  return new Server(_.defaults(options || {}, {
    allowCrossDomain: true,
    allowParseQuery: true,
    allowParseBody: true,
    serveStatic: false,
    enableAuthCheck: false,
    enableCookie: true,
    enableSession: true,
    enableGzip: false,
    enableWebSocket: false,
    enableAsyncJob: false,
    enableXactJob: false
  }));
};
