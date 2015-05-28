var express = require('express');
var Promise = require('bluebird');
var should = require('should');
var htmlToJson = require('../lib/htmlToJson');

describe('Parser', function () {
  describe('provides helper methods', function () {
    describe('#parse', function () {
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
    });

    describe('#method', function () {
      it('returns a wrapper method for .parse', function () {
        var parser = htmlToJson.createParser(function ($doc) { return $doc.find('#foo').text(); });
        var html = '<div id="foo">bar</div>';
        var method = parser.method();

        return Promise
          .all([
            parser.parse(html),
            method(html)
          ])
          .tap(function (results) {
            results[0].should.equal(results[1]);
          });
      });
    });

    describe('#request', function () {
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
});
