var express = require('express');
var Promise = require('bluebird');
var should = require('should');
var htmlToJson = require('../lib/htmlToJson');

describe('htmlToJson.createMethod()', function () {
  it('returns a method that curries the filter argument in htmlToJson.parse', function () {
    var VALUE = 'foobar';
    var method = htmlToJson.createMethod({
      foo: function ($doc) {
        return $doc.find('#val').text();
      }
    });

    return method('<div id="val">'+VALUE+'</div>').tap(function (result) {
      result.foo.should.equal(VALUE);
    });
  });
});
