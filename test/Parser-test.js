var express = require('express');
var should = require('should');
var htmlToJson = require('../lib/htmlToJson');

describe('Parser', function () {
  describe('provides helper methods', function () {
    it('runs htmlToJson.parse against the stored filter', function () {
      var parser = htmlToJson.createParser({
        'foo': function ($doc) {
          return $doc.find('#foo').text();
        }
      });

      return parser.parse('<div id="foo">bar</div>').tap(function (result) {
        result.foo.should.equal('bar');
      });
    });

    it('runs htmlToJson.request against the stored filter', function (done) {
      var app = express();
      var server;
      var parser = htmlToJson.createParser({
        'foo': function ($doc) {
          return $doc.find('#foo').text();
        }
      });

      function close(err) {
        server.close(function () {
          done(err);
        });
      }

      app.get('/', function (req, resp) {
        resp.send('<div id="foo">bar</div>');
      });

      server = app.listen(10099, function () {
        parser.parse('<div id="foo">bar</div>').done(function (result) {
          result.foo.should.equal('bar');
          close();
        }, close);
      });
    });
  });
});
