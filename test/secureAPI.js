var util = require('util');
var supertest = require('supertest');
var rask = require('../lib/main.js');

describe('secureAPI', function() {
  var server, url;

  before(function(done) {
    rask.secureAPI.loadAPIRegistry(function() {
      return {
        'jeJFiQxtb8sNaq3dez-2CI9znke7yM1hfD0JDTgaMpmy7k-WR9nBO8bnHG2MORQzNLH-JtojSQLZLiAsWKtetg':
          'f0zz8kQqFsqrvIfaif0RCHJ7VHA9R_jXnuOiV1wYeNLCbtv-FQ8rTcHcEsS_QN3mW2D3YuA_UQ_O4721qmEoXw'
      }
    });

    server = rask.server({})
      .route(function(server) {
        server.get('/secure/hello', function(req, res, next) {
          if (rask.secureAPI.check(req)) {
            res.send(200, 'world');
          } else {
            res.send(401);
          }
        });
      })
      .start();
    url = 'http://localhost:' + server._bind_port;
    done();
  });

  describe('testNormal', function() {
    it('should pass without error.', function(done) {
      supertest(url)
        .get('/secure/hello')
        .expect(401, done);
    });
  });

  describe('test401', function() {
    it('should got 401 without error.', function(done) {
      supertest(url)
        .get('/secure/hello?apiKey=jeJFiQxtb8sNaq3dez-2CI9znke7yM1hfD0JDTgaMpmy7k-WR9nBO8bnHG2MORQzNLH-JtojSQLZLiAsWKtetg&command=listISOs&response=json&signature=L1MkCDnzgNPjYrJdtN8DEQq90Q0%3D')
        .expect(200, done);
    });
  });

  after(function(done) {
    server.stop();
    done();
  });
});
