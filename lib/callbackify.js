function callbackify (promise, callback) {
  if (callback) {
    promise.done(function (data) {
      callback(null, data);
    }, function (err) {
      callback(err, null);
    });
  }

  return promise;
}

module.exports = callbackify;
