var _log4js = undefined;

function who(module) {
  var path = require('path');
  return path.basename(module.filename, '.js');
}

exports.get = function(module) {
  if (_log4js == undefined) {
    _log4js = require('log4js');
    _log4js.configure('./etc/log.json');
    if (require('fs').existsSync('./etc/test')) {
      // keep silent in test mode
    } else {
      console.log('log4js loaded, logging started.');
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
