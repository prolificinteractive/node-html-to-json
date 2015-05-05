var url = require('url');
var htmlToJson = require('../lib/htmlToJson');
var homeUrl = url.parse('http://prolificinteractive.com');

var parseLinks = htmlToJson.createParser(['a[href]', {
  'text': function ($a) {
    return $a.text().trim();
  },
  'href': function ($a) {
    return url.resolve(homeUrl, $a.attr('href'));
  },
  'headings': function () {
    return this.get('href').then(function (href) {
      var parsedUrl = url.parse(href);

      // Only bother Prolific's server for this example
      if (parsedUrl.protocol === 'http:' && parsedUrl.hostname === homeUrl.hostname) {
        return parseHeadings.request(href);
      } else {
        return null;
      }
    });
  }
}]);

var parseHeadings = htmlToJson.createParser(['h1,h2,h3,h4,h5,h6', function ($hx) {
  return $hx.text().trim();
}]);

parseLinks.request(url.format(homeUrl)).done(function (links) {
  console.log(links);
}, function (err) {
  throw err;
});
