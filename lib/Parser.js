var methods = {
  parse: require('./parse'),
  request: require('./request')
};

function Parser (filter) {
  this.filter = filter;
}

Parser.prototype.parse = function (html, callback) {
  return methods.parse(html, this.filter, callback);
};

Parser.prototype.method = function () {
  var _this = this;

  return function (html, callback) {
    return _this.parse(html, callback);
  };
};

Parser.prototype.request = function (options, callback) {
  return methods.request(options, this.filter, callback);
};

module.exports = Parser;
