var cheerio = require('cheerio');
var ParseContext = require('./ParseContext');
var callbackify = require('./callbackify');

function parse(html, filter, data, callback) {
  if (!callback && typeof data === 'function') {
    callback = data;
    data = {};
  }

  var $ = cheerio.load(html);

  var parseContext = new ParseContext({
    $: $,
    $container: $.root(),
    filter: filter,
    data: data
  });

  return callbackify(parseContext.parse(), callback);
}

module.exports = parse;
