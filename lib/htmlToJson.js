var method = require('./method');

module.exports = {
  ParseContext: require('./ParseContext'),
  Parser: require('./Parser'),
  parse: require('./parse'),
  request: require('./request'),
  batch: require('./batch'),
  createParser: function (filter) {
    return new this.Parser(filter);
  },
  createMethod: function (filter) {
    return method(filter);
  }
};
