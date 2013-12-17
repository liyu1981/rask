var log4js = undefined;

function who(module) {
  var path = require('path');
  return path.basename(module.filename, '.js');
}

exports.get = function(module) {
  if (log4js == undefined) {
    log4js = require('log4js');
    log4js.configure('./etc/log.json');
    console.log('log4js loaded, logging started.');
  }
  return log4js.getLogger(who(module));
}
