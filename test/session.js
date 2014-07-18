var util = require('util');
var assert = require('assert');
var supertest = require('supertest');
var rask = require('../lib/main.js');

describe('session', function() {
  this.timeout(20 * 1000);
  var server, url;

  before(function(done) {
    server = rask.server({ })
      .route(function(server) {
        server.get('/login', function(req, res, next) {
          rask.session.createSession(res, { maxLife: 2 });
          res.write('I\'m in.');
          res.end();
        });
        server.get('/logout', function(req, res, next) {
          rask.session.removeSession(req, res);
          res.send(200);
        })
      })
      .start();

    url = "http://localhost:" + server._bind_port;

    done();
  });

  it('should finish without error', function(done) {
    supertest(url).get('/login').expect(200).end(function(err, res) {
      // got the session server given
      var k = null;
      var s = res.headers['set-cookie'];
      for (var i=0; i<s.length; i++) {
        if(/rask-session=/.test(s[i])) {
          k = s[i].slice(13);
          break;
        }
      }

      setTimeout(function() {
        if (rask.session.findSession(k)) {
          throw util.format('session key %s still exist', k);
        } else {
          done();
        }
      }, 3000);
    });
  });

  it('should remove session without error', function(done) {
    supertest(url).get('/login').expect(200).end(function(err, res) {
      // got the session server given
      var k = null;
      var sc = null;
      var s = res.headers['set-cookie'];
      for (var i=0; i<s.length; i++) {
        if(/rask-session=/.test(s[i])) {
          sc = s[i];
          k = s[i].slice(13);
          break;
        }
      }
      supertest(url)
        .get('/logout')
        .set('Cookie', sc)
        .expect(200)
        .end(function(err, res) {
          if (rask.session.findSession(k)) {
            throw util.format('session key %s still exist', k);
          } else {
            done();
          }
        });
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
