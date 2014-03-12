// var reske = require('rask'); // Use this for real
var rask = require('../lib/main.js');
rask.server({
    serveStatic: true,
    enableWebSocket: true
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
        console.log('started client interval');
        ws.on('message', function(message) {
          if (message === "hello") {
            ws.send("world! :)");
          } else {
            ws.send("you said: " + message);
          }
        });
        ws.on('close', function() {
          console.log('stopping client interval');
          clearInterval(id);
        });
      });
    })
  .start();
