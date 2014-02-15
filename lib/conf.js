// inject the minify function forever
JSON.minify = JSON.minify || require('node-json-minify');

var log = require('./log').get(module);

var reg = {};

exports.configure = function() {
  var fs = require('fs');
  var path = require('path');

  var etc = './etc';
  if (fs.existsSync(etc)) {
    try {
      var files = fs.readdirSync(etc);
      files.forEach(function (e, i, a) {
        if (path.extname(e) === '.json') {
          var f = path.resolve(etc, e);
          var basename = path.basename(f, '.json');
          log.info('loading', f);
          // minify will eliminate the comments in JSON
          reg[basename] = JSON.parse(JSON.minify(fs.readFileSync(f).toString()));
          log.info('\\==> group', basename);
        }
      });
    } catch(e) {
      log.fatal('failed in configure: ', e);
      process.exit(1);
    }
  }

  // now check and (if necessary) fill in default confs
  // TODO: probably merge the server.conf and session.conf
  if (!('server' in reg)) {
    reg['server'] = {
      "bind_port": 12345,
      "bunyan": {
        "name": "base-server",
        "streams": [
          {
          "level": "error",
          "path": "./log/base-server-error.log"
          }
        ]
      },
      "static": {
        "default": "index.html",
        "directory": "./static"
      }
    };
  }
  if (!('session' in reg)) {
    reg['session'] = {
      "session_name": "myct-session",
      "default_session_lifetime_in_seconds": 7200,
      "check_period_in_seconds": 60,
      "fail_redirect": "/login"
    };
  }
};

exports.get = function(group) {
  if (group && reg[group]) {
    return reg[group];
  } else {
    return reg['server'];
  }
};
