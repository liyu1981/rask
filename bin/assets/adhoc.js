var fs = require('fs');

var mainEntry = process.argv[process.argv.length - 1];
if (process.argv[process.argv.length - 1] === 'adhoc.js') {
  console.log('usage: mocha --require blanket -R html-cov adhoc.js <your main.js>');
  process.exit(1);
}

describe('serverBindHost', function() {
  var server = null;
  this.timeout(0);

  before(function(done) {
    (function ensureTestMode() {
      if (!fs.readdirSync('./etc')) {
        var e = fs.mkdirSync('./etc');
        if (e) throw e;
      }
      if (!fs.existsSync('./etc/test')) {
        var e = fs.writeFileSync('./etc/test');
        if (e) throw e;
      }
    })();
    require(mainEntry);
    server = require('rask').test.lastServer;
    done();
  });

  it('should finish without error.', function(done) {
    process.on('SIGINT', done);
    //process.on('SIGTERM', done);
  });

  after(function(done) {
    server.stop();
    fs.unlinkSync('./etc/test');
    done();
  });
});

