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
  this.timeout(20 * 1000);

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
      //console.log('k is:', k);

      setInterval(function() {
          if (rask.session.findSession(k)) {
            throw util.format('session key %s still exist', k);
          } else {
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
