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
};

exports.has = function(group) {
  return group in reg;
};

exports.merge = function(group, value) {
  if (exports.has(group)) {
    _.extend(reg[group], value);
  } else {
    reg[group] = value;
  }
};

exports.get = function(group) {
  if (group && reg[group]) {
    return reg[group];
  } else {
    return reg['server'];
  }
};
