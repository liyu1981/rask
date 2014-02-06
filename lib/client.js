var restify = require('restify');
exports.createJsonClient = restify.createJsonClient;
exports.createStringClient = restify.createStringClient;
exports.createClient = restify.createClient;
exports.createFormJsonClient = require('./formJsonClient').createFormJsonClient;
