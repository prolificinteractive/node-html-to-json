var should = require('should');
var htmlToJson = require('../lib/htmlToJson');

describe('htmlToJson.batch', function () {
  var HTML = '<div id="el" data-foo="bar" data-widget="sprocket">test</div>';
  var gettingResult = htmlToJson.batch(HTML, {
    nakedFilter: {
      'foo': function ($doc) {
        return $doc.find('#el').attr('data-foo');
      }
    },
    parser: htmlToJson.createParser({
      'widget': function ($doc) {
        return $doc.find('#el').attr('data-widget');
      }
    }),
    method: htmlToJson.createMethod({
      'text': function ($doc) {
        return $doc.find('#el').text();
      }
    })
  });

  it('should apply naked filters to HTML', function () {
    return gettingResult.tap(function (result) {
      result.nakedFilter.foo.should.equal('bar');
    });
  });

  it('should apply Parser objects to HTML generated from .createParser', function () {
    return gettingResult.tap(function (result) {
      result.parser.widget.should.equal('sprocket');
    });
  });

  it('should apply filter methods to HTML generated from .createMethod', function () {
    return gettingResult.tap(function (result) {
      result.method.text.should.equal('test');
    });
  });
});
