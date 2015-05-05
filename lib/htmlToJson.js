module.exports = {
  ParseContext: require('./ParseContext'),
  Parser: require('./Parser'),
  parse: require('./parse'),
  request: require('./request'),
  createParser: function (filter) {
    return new this.Parser(filter);
  }
};
