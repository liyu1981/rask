var restify = require('restify');
exports.createJsonClient = restify.createJsonClient;
exports.createStringClient = restify.createStringClient;
exports.createHttpClient = restify.createHttpClient;
exports.createFormJsonClient = require('./formJsonClient').createFormJsonClient;
