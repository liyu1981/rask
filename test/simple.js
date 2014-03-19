var util = require('util');
var assert = require('assert');
var supertest = require('supertest');
var rask = require('../lib/main.js');

describe('simpleServer', function() {
  var server, url;

  before(function(done) {
    server = rask.server({
        serveStatic: true,
        enableWebSocket: true,
        enableGzip: true
      })
      .route(function(server) {
          server.get('/hello', function(req, res, next) {
              res.send(200, 'world');
            });
          server.get('/login', function(req, res, next) {
              rask.session.createSession(res);
              res.write('I\'m in.');
              res.end();
            });
        })
      .wsRoute(function(wsServer) {
          wsServer.on('connection', function(ws) {
            var id = setInterval(function() {
              ws.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });
            }, 1000);
            //console.log('started client interval');
            ws.on('close', function() {
              //console.log('stopping client interval');
              clearInterval(id);
            });
          });
        })
      .start();

    url = "http://localhost:" + server._bind_port;
    done();
  });

  it('should get "world" with request "hello"', function(done) {
    supertest(url)
      .get('/hello')
      .expect(200)
      .end(function(err, res) {
          if (err) throw err;
          if (res.body === 'world') {
            done();
          } else {
            throw util.format('wrong result: %s', res.body);
          }
        });
  });

  it('should do session redirect without error.', function(done) {
    supertest(url)
      .get('/index.html')
      .expect(302, done);
  });

  it('should deal with session without error.', function(done) {
    var mysession = null;
    supertest(url)
      .get('/login')
      .expect(200)
      .end(function(err, res) {
          if (err) throw err;
          // got the session server given
          var s = res.headers['set-cookie'];
          for (var i=0; i<s.length; i++) {
            if(/rask-session=/.test(s[i])) {
              mysession = s[i];
              break;
            }
          }
          if (mysession === null) {
            throw 'no session found.'
          }
          // try again with server session
          supertest(url)
            .get('/index.html')
            .set('Cookie', mysession)
            .expect(200)
            .end(function(err2, res2) {
                if (err2) throw err2;
                done();
              });
        });
  });

  after(function(done) {
    server.stop();
    done();
  });
});

describe('serverBindHost', function() {
  var server, url;

  before(function(done) {
    server = rask.server({
      })
      .route(function(server) {
        server.get('/hello', function(req, res, next) {
          res.send(200, 'world');
        });
      })
      .start({
        bind_host: '127.0.0.1'
      });

    url = "http://127.0.0.1:" + server._bind_port;
    done();
  });

  it('should finish without error.', function(done) {
    supertest(url)
      .get('/hello')
      .expect(200)
      .end(done);
  });

  after(function(done) {
    server.stop();
    done();
  });
});

describe('serverBindSock', function() {
  var server, url;

  before(function(done) {
    server = rask.server({
      })
      .route(function(server) {
        server.get('/hello', function(req, res, next) {
          res.send(200, 'world');
        });
      })
      .start({
        bind_sock: '/tmp/rask.sock'
      });

    url = '/tmp/rask.sock';
    done();
  });

  it('should finish without error.', function(done) {
    // supertest does not support unix sock, so turn to nodejs native
    require('http').request({ socketPath: '/tmp/rask.sock', path: '/hello', method: 'GET'}, function(res) {
      assert.equal(res.statusCode, 200);
      done();
    }).end();
  });

  after(function(done) {
    server.stop();
    done();
  });
});
