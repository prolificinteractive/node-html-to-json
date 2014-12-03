var Q = require('q');
var request = require('request');
var parse = require('./parse');

module.exports = function (options, structure, data, _callback) {
  var deferred = Q.defer();

  if (!_callback && typeof data === 'function') {
    _callback = data;
    data = {};
  }

  function callback(err, result) {
    if (_callback) {
      _callback(err, result);
    }

    if (err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
  }

  request(options, function (err, response) {
    if (err) {
      callback(err, null);
      return;
    }

    parse(response.body, structure, data, callback);
  });

  return deferred.promise;
};
