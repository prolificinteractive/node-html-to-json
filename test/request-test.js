var http = require('http');
var express = require('express');
var htmlToJson = require('../lib/htmlToJson');

describe('htmlToJson.request', function () {
  it('should take request library options and a filter, then return parsed results based on the response body', function (done) {
    var app = express();
    var server = http.createServer(app);
    var port = 19999;

    app.get('/', function (req, resp) {
      resp.send('<div id="val">' + req.query.val + '</div>');
    });

    server.listen(port, function () {
      var val = 999;

      htmlToJson.request({
        uri: 'http://localhost:' + port,
        qs: {
          val: val
        }
      }, {
        'val': function ($doc) {
          return +$doc.find('#val').text();
        }
      }, function (err, result) {
        result.val.should.equal(val);
        server.close(done);
      });
    });
  });
});
