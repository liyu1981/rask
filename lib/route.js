var util = require('util');
var _ = require('underscore');
var restify = require('restify');

var log = require('./log').get(module);
restify.createFormJsonClient = require('./formJsonClient').createFormJsonClient;
var actionQueue = require('./actionQueue');

var c = require('./conf').get('server');
var errmap = require('./conf').get('error');

exports.register = function(server) {
  server.get('/hello', function(req, res, next) {
      res.send(200, 'world');
    });

  server.get('/login', function(req, res, next) {
      require('./sessionChecker').createSession(res);
      res.write('I\'m in.');
      res.end();
    });
}
