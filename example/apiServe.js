var util = require('util');
var _ = require('underscore');
var reske = require('../lib/main.js');

var log = reske.log.get(module);
var c = reske.conf.get('server');
var errmap = reske.conf.get('error');

exports.register = function(server) {
  server.get('/hello', function(req, res, next) {
      res.send(200, 'world');
    });

  server.get('/login', function(req, res, next) {
      reske.session.createSession(res);
      res.write('I\'m in.');
      res.end();
    });
};
