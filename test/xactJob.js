var util = require('util');
var supertest = require('supertest');
var rask = require('../lib/main.js');
var _ = rask.underscore;

describe('xactJob', function() {
  var server, url;
  this.timeout(20 * 1000);

  before(function(done) {
    server = rask.server({
        enableXactJob: true
      })
      .route(function(server) {
        server.get('/ajob/create', function(req, res, next) {
          rask.xactJob.create({}, function(key) {
            res.send(200, { jobId: key });
          });
        });
        server.get('/ajob/hello', function(req, res, next) {
          var key = req.params['jobId'];
          rask.xactJob.check(key, function(err, key) {
            if (err) {
              res.send(500, { err: err });
              return;
            }
            rask.xactJob.store(key, { hello: 'world' }, function(err) {
              if (err) {
                res.send(500, { err: err });
                return;
              }
              res.send(200);
            });
          });
        });
        server.get('/ajob/finish', function(req, res, next) {
          var key = req.params['jobId'];
          rask.xactJob.check(key, function(err) {
            if (err) {
              res.send(500, { err: err });
              return;
            }
            rask.xactJob.finish(key);
            res.send(200);
          });
        });
      })
      .start();
    url = 'http://localhost:' + server._bind_port;
    done();
  });

  describe('testNormal', function() {
    it('should finish without error', function(done) {
      supertest(url)
        .get('/ajob/create')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          var jobId = res.body.jobId;
          supertest(url)
            .get('/ajob/hello?jobId=' + jobId)
            .expect(200)
            .end(function(err, res) {
              supertest(url)
                .get('/ajob/finish?jobId=' + jobId)
                .expect(200)
                .end(function(err, res) {
                  if (err) throw err;
                  done();
                });
            });
        });
    });
  });

  describe('testTimeout', function() {
    it('should finish without error', function(done) {
      supertest(url)
        .get('/ajob/create')
        .expect(200)
        .end(function(err, res) {
          if (err) throw err;
          var jobId = res.body.jobId;
          setTimeout(function() {
          supertest(url)
            .get('/ajob/hello?jobId=' + jobId)
            .expect(500)
            .end(function(err, res) {
              done();
            });
          }, 6000);
        });
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
