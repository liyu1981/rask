// var reske = require('reskeleton'); // Use this for real
var reske = require('../lib/main.js');
reske.server({
    serveStatic: true
  })
  .start(function(server) {
    require('./apiServe').register(server);
  });
