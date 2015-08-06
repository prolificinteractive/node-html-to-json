var parse = require('./parse');

function method (filter) {
  return function (html, callback) {
    return parse(html, filter, callback);
  };
}

module.exports = method;
