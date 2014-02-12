var util = require('util');
var _ = require('underscore');

exports.init = function() {
};

function registerAPIUser(req, res, next) {
}

exports.register = function(server) {
  server.get('/secureAPI/user/register', registerAPIUser);
};
