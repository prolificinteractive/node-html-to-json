var cheerio = require('cheerio');
var ParseContext = require('./ParseContext');

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

  var promise = parseContext.parse();

  if (callback) {
    promise.done(function (data) {
      callback(null, data);
    }, function (err) {
      callback(err, null);
    });
  }

  return promise;
}

module.exports = parse;
