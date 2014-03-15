// Copyright 2012 Mark Cavage, Inc.  All rights reserved.
// Adapted from Mark Cavage's json_client.js of restify
// by Li Yu (liyu@clustertech.com) 2013

var crypto = require('crypto');
var util = require('util');
var querystring = require('querystring');

var restify_path = '../node_modules/restify';

var assert = require(restify_path + '/node_modules/assert-plus');
var codeToHttpError = require(restify_path + '/lib/errors/http_error').codeToHttpError;
var RestError = require(restify_path + '/lib/errors').RestError;
var StringClient = require(restify_path + '/lib/clients/string_client');
var shallowCopy = require(restify_path + '/lib/utils').shallowCopy;

///--- API

function FormJsonClient(options) {
  assert.object(options, 'options');

  options.accept = 'application/json';
  options.name = options.name || 'FormJsonClient';
  options.contentType = 'application/x-www-form-urlencoded';

  StringClient.call(this, options);

  this._super = StringClient.prototype;
}

util.inherits(FormJsonClient, StringClient);

FormJsonClient.prototype.write = function write(options, body, callback) {
  assert.ok(body !== undefined, 'body');
  assert.object(body, 'body');

  body = querystring.stringify(body !== null ? body : {});
  return (this._super.write.call(this, options, body, callback));
};

FormJsonClient.prototype.parse = function parse(req, callback) {
  var log = this.log;
  function parseResponse(err, req2, res, data) {
    var obj;
    //console.log('formJsonClient got data: ', data);
    //console.log('formJsonClient callback is: ', callback);
    try {
      if (data && !/^\s*$/.test(data)) {
        obj = JSON.parse(data);
      }
    } catch (e) {
      // Not really sure what else we can do here, besides
      // make the client just keep going.
      log.trace(e, 'Invalid JSON in response');
    }
    obj = obj || {};

    if (res && res.statusCode >= 400) {
      // Upcast error to a RestError (if we can)
      // Be nice and handle errors like
      // { error: { code: '', message: '' } }
      // in addition to { code: '', message: '' }.
      if (obj.code || (obj.error && obj.error.code)) {
        var _c = obj.code || (obj.error ? obj.error.code : '') || '';
        var _m = obj.message || (obj.error ? obj.error.message : '') || '';
        err = new RestError({
          message: _m,
          restCode: _c,
          statusCode: res.statusCode
        });
        err.name = err.restCode;
        if (!/Error$/.test(err.name)) {
          err.name += 'Error';
        }
      } else if (!err) {
        err = codeToHttpError(res.statusCode, obj.message || '', data);
      }
    }

    if (err) {
      err.body = obj;
    }

    callback((err || null), req2, res, obj);
  }

  return (this._super.parse.call(this, req, parseResponse));
};

exports.createFormJsonClient = function(options) {
  var bunyan = require(restify_path + '/lib/bunyan_helper');
  var opts = shallowCopy(options);
  opts.agent = options.agent;
  opts.name = opts.name || 'restify';
  opts.type = opts.type || 'application/octet-stream';
  opts.log = opts.log || bunyan.createLogger(opts.name);
  return new FormJsonClient(opts);
};
