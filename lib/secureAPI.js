/* secureAPI implemented the API safety checking in CloudStack

   details:
     http://cloudstack.apache.org/docs/en-US/Apache_CloudStack/4.0.2/html/API_Developers_Guide/signing-api-requests.html

   typical usage as:

   create a server by:

     rask
       .server({})
       .route(function(server) {
            server.get('/api/hello', function(req, res, next) {
              if (rask.secureAPI.check(req)) {
                // logic
              } else {
                res.send('401', 'Not authorized.');
              }
            });
          })
       .start();
*/

var log = require('./log').get(module);

var apiRegistry = {};

exports.loadAPIRegistry = function(feeder) {
  apiRegistry = feeder();
};

function findAPISecret(apiKey) {
  if (apiRegistry && apiRegistry[apiKey]) {
    return apiRegistry[apiKey];
  }
  return '';
};

exports.check = function(req) {
  if (!('signature' in req.params) || !('apiKey' in req.params)) {
    return false;
  }

  var paramKeys = [];
  for(var key in req.params) {
    if (key !== 'signature' && req.params.hasOwnProperty(key)) {
      paramKeys.push(key);
    }
  }
  paramKeys.sort();
  var qsParameters = [];
  for (var i=0; i<paramKeys.length; i++) {
    key = paramKeys[i];
    qsParameters.push(key + '=' + encodeURIComponent(req.params[key]));
  }
  var queryString = qsParameters.join('&'),
      cryptoAlg = require('crypto').createHmac('sha1', findAPISecret(req.params['apiKey'])),
      signature = cryptoAlg.update(queryString.toLowerCase()).digest('base64');
  if (req.params['signature'] === signature) {
    return true;
  }
  return false;
};
