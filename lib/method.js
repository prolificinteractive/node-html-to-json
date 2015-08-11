var parse = require('./parse');

function method (filter) {
  var _method = function (html, callback) {
    return parse(html, filter, callback);
  };

  _method.filter = filter;

  return _method;
}

module.exports = method;
