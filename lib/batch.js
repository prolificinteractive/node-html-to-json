var cheerio = require('cheerio');
var _ = require('lodash');
var Promise = require('bluebird');
var Parser = require('./Parser');
var ParseContext = require('./ParseContext');
var callbackify = require('./callbackify');

function batch (html, dictionary, callback) {
  var promise;
  var $ = cheerio.load(html);
  var context = new ParseContext({
    $: $,
    $container: $.root()
  });

  promise = Promise.props(_.mapValues(dictionary, function (filter) {
    // Filter is wrapped by .createParser or .createMethod
    if (filter.filter) {
      filter = filter.filter;
    }

    context.filter = filter;

    return context.parse();
  }));

  return callbackify(promise, callback);
}

module.exports = batch;
