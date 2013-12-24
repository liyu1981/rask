var cookie = require('cookie');

exports.cookieParser = function() {
  return function(req, res, next) {
    console.log('headers: ', req.headers);
    if (req.headers.cookie) {
      var r = cookie.parse(req.headers.cookie);
      console.log('parsed: ', r);
      req.headers.cookie = r;
    } else {
      req.headers.cookie = {};
    }
    next();
  };
};

exports.parse = cookie.parse;
exports.serialize = cookie.serialize;
