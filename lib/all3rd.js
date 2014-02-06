exports.export = function(topExports) {
  [
    'underscore',
    'node-uuid',
    'cookie',
    'restify'
  ].forEach(function(lib) {
    topExports[lib] = require(lib);
  });
};
