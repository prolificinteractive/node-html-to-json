var cheerio = require('cheerio');
var ParseContext = require('./ParseContext');
var callbackify = require('./callbackify');

function parse (html, filter, callback) {
  if (typeof html !== 'string') {
    throw new Error('HTML string required');
  }

  var $ = cheerio.load(html);

  var parseContext = new ParseContext({
    $: $,
    $container: $.root(),
    filter: filter
  });

  return callbackify(parseContext.parse(), callback);
}

module.exports = parse;
