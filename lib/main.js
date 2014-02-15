var path = require('path');
var fs = require('fs');

require('./common').init();

// now ensure the dir structure
(function() {
  [
    './log',
    './etc',
    './var'
  ].forEach(function(d) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, 0775);
    }
  });
})();

var log = require('./log').get(module);

log.info('start loading config files.');
var conf = require('./conf');
conf.configure();
log.info('all config files loaded.');

// delegate export all 3rd libs first
require('./all3rd').export(exports);

// delegate export apis then
(function() {
  [
    './log',
    './conf',
    './server',
    './client',
    './session',
    './actionQueue',
    './workflow',
    './asyncJob',
    './secureAPI'
  ].forEach(function(elem) {
    exports[path.basename(elem)] = require(elem);
  });
})();
