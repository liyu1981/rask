// var reske = require('rask'); // Use this for real
var rask = require('../lib/main.js');
rask.server({
    serveStatic: true
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
  .start();
