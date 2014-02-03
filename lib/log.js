var _log4js = undefined;

function who(module) {
  var path = require('path');
  return path.basename(module.filename, '.js');
}

exports.get = function(module) {
  if (_log4js == undefined) {
    _log4js = require('log4js');
    _log4js.configure('./etc/log.json');
    console.log('log4js loaded, logging started.');
  }
  return _log4js.getLogger(who(module));
};
