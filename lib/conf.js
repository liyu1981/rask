var log = require('./log').get(module);

var reg = {};

exports.configure = function() {
  var fs = require('fs');
  var path = require('path');

  var etc = './etc';
  try {
    var files = fs.readdirSync(etc);
    files.forEach(function (e, i, a) {
      if (path.extname(e) === '.json') {
        var f = path.resolve(etc, e);
        var basename = path.basename(f, '.json');
        log.info('loading', f);
        var b = fs.readFileSync(f);
        reg[basename] = JSON.parse(b);
        log.info('\\==> group', basename);
      }
    });
  } catch(e) {
    log.fatal('failed in configure: ', e);
    process.exit(1);
  }
};

exports.get = function(group) {
  if (group && reg[group]) {
    return reg[group];
  } else {
    return reg['server'];
  }
};
