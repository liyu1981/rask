var util = require('util');

var rask = require('../lib/main.js');
var server = rask.server({})
  .route(function(server) {
      server.post('/login', function(req, res, next) {
          if (req.body['user'] === 'liyu') {
            rask.session.createSession(res);
            res.send(200, { result: 'I\'m in.'});
          } else if(req.body['user'] === 'nobody') {
            res.write('{Do not know you.');
            res.end();
          } else if(req.body['user'] === 'nobody2'){
            res.send(401, { code: 10401, message: 'wrong id'});
          } else {
            res.send(501);
          }
        });
    })
  .start();

var url = "http://localhost:12345";

describe('formJsonClient', function() {
  describe('testNormal', function() {
    it('should login successful without error', function(done) {
      var c = rask.client.createFormJsonClient({
        url: url
      });
      c.post('/login', { user: 'liyu' },
        function(err, req, res, obj) {
          if (err) throw err;
          if (obj['result'] === "I'm in.") {
            done();
          } else {
            throw util.format('wrong body: %j', obj);
          }
        });
    });
  });

  describe('testWrongJsonResp', function() {
    it('should get some no json resp without error', function(done) {
      var c = rask.client.createFormJsonClient({
        url: url
      });
      c.post('/login', { user: 'nobody' },
        function(err, req, res, obj) {
          if (err) throw err;
          if (typeof res.body === 'string') {
            done();
          } else {
            throw util.format('wrong body: %j', res.body);
          }
        });
    });
  });

  describe('testErr', function() {
    it('should get some error info without error', function(done) {
      var c = rask.client.createFormJsonClient({
        url: url
      });
      c.post('/login', { user: 'nobody2' },
        function(err, req, res, obj) {
          if (err && obj.code === 10401 && obj.message === 'wrong id') {
            done();
          } else {
            throw util.format('got err: %j, obj: %j', err, obj);
          }
        });
    });

    it('should get some error without error', function(done) {
      var c = rask.client.createFormJsonClient({
        url: url
      });
      c.post('/login', { user: 'nobody3' },
        function(err, req, res, obj) {
          if (err && err.statusCode === 501) {
            done();
          } else {
            throw util.format('got err: %j, obj: %j', err, obj);
          }
        });
    });
  });
});
