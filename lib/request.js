var request = require('request');
var Promise = require('bluebird');
var parse = require('./parse');
var callbackify = require('./callbackify');

module.exports = function (options, filter, callback) {
  var promise;

  promise = new Promise(function (resolve, reject) {
    request(options, function (err, response) {
      if (err) {
        return reject(err);
      }

      resolve(response);
    });
  });

  promise = promise.then(function (response) {
    return parse(response.body, filter);
  });

  return callbackify(promise, callback);
};
