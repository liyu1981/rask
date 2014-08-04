/* Ping server is just the simplest ping/pong service.

   Default apis exposed:
     GET /ping
 */
function ping(req, res, next) {
  res.send(200, 'pong');
}

exports.register= function(server) {
  server.get('/ping', ping);
};
