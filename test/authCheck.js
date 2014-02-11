var util = require('util');
var supertest = require('supertest');

var rask = require('../lib/main.js');

var server = rask.server({
    serveStatic: function(defaultStaticHandler) {
        return function(server) {
          server.get(/.*/, defaultStaticHandler);
        }
      },
    enableAuthCheck: true,
    enableGzip: true
  })
  .addPreRouteHook(function(req, res, next) {
    next();
  })
  .route(function(server) {
      server.get('/exception', function(req, res, next) {
          throw 'Catch me';
        });
    })
  .start();

describe('authCheck', function() {
  describe('testNormal', function() {
    var url = "http://localhost:" + server._bind_port;
    it('should get exception', function(done) {
      supertest(url)
        .get('/exception')
        .expect(401)
        .end(function() {
          supertest(url)
            .get('/exception')
            .set('Authorization', 'Basic ' + new Buffer('test:test').toString('base64'))
            .expect(200)
            .end(function(err, res) {
              if (err) throw err;
              if (res.body.errno === 'InternalError') {
                s.stop();
                done();
              } else {
                throw util.format('wrong result: %s', res.body);
              }
            });
        });
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
