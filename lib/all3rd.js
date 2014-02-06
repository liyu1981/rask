exports.export = function(topExports) {
  [
    'underscore',
    'node-uuid',
    'restify'
  ].forEach(function(lib) {
    topExports[lib] = require(lib);
  });
};
