var cheerio = require('cheerio');
var ParseContext = require('./ParseContext');
var callbackify = require('./callbackify');

function parse (html, filter, callback) {
  var isCheerioObject = typeof html === 'object' && html._root._root;

  if (typeof html !== 'string' && !isCheerioObject) {
    throw new Error('HTML string required');
  }

  var $ = cheerio.load(html);

  var parseContext = new ParseContext({
    $: $,
    $container: isCheerioObject? html: $.root(),
    filter: filter
  });

  return callbackify(parseContext.parse(), callback);
}

module.exports = parse;
