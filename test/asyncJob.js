var util = require('util');
var supertest = require('supertest');
var rask = require('../lib/main.js');

describe('asyncJob', function() {
  var server, url;
  this.timeout(20 * 1000);

  before(function(done) {
    server = rask.server({
        enableAsyncJob: true
      })
      .route(function(server) {
          server.get('/ajob/create', function(req, res, next) {
              var j = rask.asyncJob.create('testJob', function(done) {
                setTimeout(function() {
                  done(null, { hello: 'world!' });
                }, 5000);
              });
              j.on('id_assigned', function(id) {
                res.send(200, { jobId: id });
              });
            });
        })
      .start();
    url = 'http://localhost:' + server._bind_port;
    done();
  });

  describe('testNormal', function() {
    it('should finish without error', function(done) {
      setTimeout(function() {
        supertest(url)
          .get('/ajob/create')
          .expect(200)
          .end(function(err, res) {
              if (err) throw err;
              var jobId = res.body.jobId;
              setTimeout(function() {
                supertest(url)
                  .get('/asyncJob/query?id=' + jobId)
                  .expect(200)
                  .end(function(err, res) {
                      if (err) throw err;
                      if (res.body._id === jobId && res.body.status === 'ok' && res.body.result['hello'] === 'world!') {
                        done();
                      } else {
                        throw util.format('wrong body:', res.body);
                      }
                    });
              }, 7000);
            });
      }, 1000);
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
