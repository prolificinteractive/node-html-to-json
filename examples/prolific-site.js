var url = require('url');
var htmlToJson = require('../lib/htmlToJson');

function getProlificLinks(callback) {
  var uri = 'http://prolificinteractive.com';

  // Iteratively applies a filter against all links on the page
  return htmlToJson.request(uri, ['a[href]', {
    'text': function ($a) {
      return $a.text().trim();
    },

    'href': function ($a) {
      return url.resolve(uri, $a.attr('href'));
    },

    'headings': function () {
      // Depends on the href property
      return this.get('href').then(function (href) {
        var parsedUrl = url.parse(href);

        // Only bother Prolific's server for this example
        if (parsedUrl.protocol === 'http:' && parsedUrl.host === 'prolificinteractive.com') {
          return getHeadings(href);
        } else {
          return null;
        }
      });
    }
  }], callback);
}

function getHeadings(uri, callback) {
  return htmlToJson.request(uri, ['h1,h2,h3,h4,h5,h6', function ($hx) {
    return $hx.text().trim();
  }], callback);
}

getProlificLinks(function (err, links) {
  console.log(err, links);
});
