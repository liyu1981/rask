var rask = require('../lib/main.js');

var util = require('util');
var supertest = require('supertest');

var rask = require('../lib/main.js');
var server = rask.server({
  })
  .route(function(server) {
      server.get('/login', function(req, res, next) {
          rask.session.createSession(res, { maxLife: 2 });
          res.write('I\'m in.');
          res.end();
        });
    })
  .start();

var url = "http://localhost:" + server._bind_port;

describe('session', function() {
  this.timeout(6000);
  it('should finish without error', function(done) {
    supertest(url).get('/login').expect(200).end(function(err, res) {
      setInterval(function() {
          if (rask.session.size() <= 0) {
            done();
          }
        }, 3000);
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
