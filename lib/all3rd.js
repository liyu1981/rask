exports.export = function(topExports) {
  [
    'underscore',
    'node-uuid'
  ].forEach(function(lib) {
    topExports[lib] = require(lib);
  });
};
