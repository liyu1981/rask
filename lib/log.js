var _log4js = undefined;

function who(module) {
  var path = require('path');
  return path.basename(module.filename, '.js');
}

var defaultLogConf = {
  "appenders": [
    { "type": "console",
      "layout": {
        "type": "pattern",
        "pattern": "%[%r %p %c -%] %m"
      }
    }
  ],
  "replaceConsole": true
};

exports.get = function(module) {
  if (_log4js == undefined) {
    _log4js = require('log4js');
    if (require('fs').existsSync('./etc/log.json')) {
      _log4js.configure('./etc/log.json');
      if (require('fs').existsSync('./etc/test')) {
        // keep silent in test mode
      } else {
        console.log('log4js loaded, logging started.');
      }
    } else {
      // load default log conf, and we always keep in silent
      _log4js.configure(defaultLogConf);
    }
  }
  return _log4js.getLogger(who(module));
};

(function() {
  var fs = require('fs');
  if (!fs.existsSync('./log')) {
    fs.mkdirSync('./log', 0775);
  }
})();
