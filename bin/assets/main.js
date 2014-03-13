var rask = require('rask');
rask
  .server({
    enableWebSocket: true
  })
  .route(function(server) {
    server.get('/hello', function(req, res, next) {
      res.send(200, 'world');
    });
  })
  .wsRoute(function(wsServer) {
    wsServer.on('connection', function(ws) {
      ws.on('message', function(message) {
          ws.send("you said: " + message);
      });
    });
  })
  .start();
