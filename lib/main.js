var path = require('path');

require('./common').init();

var log = require('./log').get(module);

log.info('start loading config files.');
var conf = require('./conf');
conf.configure();
log.info('all config files loaded.');

[
  './log',
  './conf',
  './server',
  './client',
  './session',
  './actionQueue'
].forEach(function(elem) {
  exports[path.basename(elem)] = require(elem);
});
