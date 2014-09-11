var util = require('util');
var _ = require('underscore');

var log = require('./log').get(module);

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

// wrap server functions to show 'register POST /asyncJob/query' like msg in log
function wrapServerFunctions(server) {
  ['get', 'post'].forEach(function(m) {
    server['_' + m] = server[m];
    server[m] = (function(m) {
      var _m = '_' + m;
      return function() {
        log.info('route registering:', m, arguments[0]);
        server[_m].apply(this, arguments);
      };
    })(m);;
  });
}

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

Server.prototype.start = function(serverConf) {
  checkConf();

  var self = this;
  var restify = require('restify');

  // user can override the conf with param serverConf
  var c = _.extend({}, require('./conf').get(), serverConf);

  // create the restify server
  var server = restify.createServer({
    name: c['name'] || 'raskapp',
    log: require('bunyan').createLogger(c['bunyan'])
  });
  this._server = server;

  // wrap server functions to show 'register POST /asyncJob/query' like msg in log
  wrapServerFunctions(server);

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
    var ac = require('./authCheck').init(server);
    if (_.isFunction(this.options['enableAuthCheck'])) {
      server.use(this.options['enableAuthCheck']);
    } else {
      server.use(ac.getDefaultChecker(server, c));
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

  // enable session
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

  // enable ping server
  if (this.options['enablePing']) {
    require('./ping').register(server);
  }

  // gzip
  if (this.options['enableGzip']) {
    server.use(restify.gzipResponse());
  }

  // serve static
  if (this.options['serveStatic']) {
    var ss = require('./serveStatic');
    if (_.isFunction(this.options['serveStatic'])) {
      ss.register(server, this.options['serveStatic']);
    } else {
      ss.register(server);
    }
  }

  // copy from restify source, for better uncaughtException reporting
  server.on('uncaughtException', function (req, res, route, e) {
    self.emit('serverInternalError', route, e);
    log.error('uncaughtException:');
    log.error('  route=', route);
    log.error('  err=', e);
    // try our best here, since the client connection may be lost
    try {
      res.send(200, { errno: 'InternalError', message: e.message });
    } catch(e) {
      // client connection is lost, nothing can do
      log.error('client connection lost, report error back skipped.');
    }
    return true;
  });

  // now start listening
  if (c['bind_sock']) {
    server.listen(c['bind_sock'], function() {
      log.info('%s listening at %s', server.name, c['bind_sock']);
    });
  } else {
    // generate a port if specified random
    if (c['bind_port'] === 'random') {
      // random port range [10000, 60000)
      this._bind_port = Math.floor((Math.random() * 60000) + 10000);
    }
    server.listen(this._bind_port || parseInt(c['bind_port']) || 12345, c['bind_host'] || '0.0.0.0', function() {
      log.info('%s listening at %s', server.name, server.url);
    });
  }

  // WebSocket
  if (this.options['enableWebSocket']) {
    this._wsServer = new (require('ws').Server)({ server: this._server });
    if (this.wsrr) {
      this.wsrr(this._wsServer);
      this.wsrr = null;
    }
  }

  this.emit('serverStarted');

  // in test mode, we keep record of our last server
  if (require('./test').testMode) {
    require('./test').lastServer = this;
  }

  return this;
};

Server.prototype.stop = function(callback) {
  this.emit('serverWillClose');
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
    enableXactJob: false,
    enablePing: true
  }));
};
