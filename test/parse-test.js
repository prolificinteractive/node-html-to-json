var _ = require('lodash');
var Promise = require('bluebird');
var parse = require('../lib/parse');
var simpleMarkup = '<div class="foo">1</div><div class="bar">2</div>';

describe('htmlToJson.parse', function () {
  it('takes a callback', function (done) {
    parse('', {}, done);
  });

  it('returns a promise', function () {
    return parse('', {});
  });

  describe('function filter', function () {
    it('assigns the return of the function to the result value', function () {
      return parse(simpleMarkup, ['div', {
        'className': function ($div) {
          return $div.attr('class');
        },
        'text': function ($div) {
          return $div.text().trim();
        },
        'classAndText': function () {
          return Promise.join(this.get('className'), this.get('text'), function (className, text) {
            return className + text;
          });
        }
      }]).tap(function (results) {
        results[0].classAndText.should.equal('foo1');
        results[1].classAndText.should.equal('bar2');
      });
    });

    it('assigns the resolved value as the result value if a promise is returned', function () {
      return parse(simpleMarkup, function () {
        return Promise.resolve(1);
      }).tap(function (result) {
        result.should.equal(1);
      });
    });

    it('exposes cheerio objects to parse data from', function () {
      return parse(simpleMarkup, function ($doc, $) {
        $doc.find('.foo').text().should.equal('1');
        $('.bar').text().should.equal('2');
      });
    });
  });

  describe('constant filter', function () {
    it('assigns the filter as the result value', function () {
      return parse(simpleMarkup, 1).tap(function (result) {
        result.should.equal(1);
      });
    });
  });

  describe('object filter', function () {
    it('iterates through each key and recursively uses the values as filters', function () {
      return parse(simpleMarkup, {
        x: 1,
        y: 2
      }).tap(function (result) {
        result.x.should.equal(1);
        result.y.should.equal(2);
      });
    });

    describe('$container modifier', function () {
      it('sets the DOM context to elements matched by $container selector', function () {
        return parse(simpleMarkup, {
          $container: '.bar',
          'id': function ($el) {
            return $el.attr('class');
          }
        }).tap(function (result) {
          result.id.should.equal('bar');
        });
      });
    });
  });

  describe('filter context methods', function () {
    describe('.get(property)', function () {
      it('returns a promise that is resolved whenever the given property is resolved', function () {
        return parse('', {
          'x': function () {
            return Promise.resolve('foo');
          },
          'y': function () {
            return this.get('x').then(function (x) {
              return x + 'bar';
            });
          }
        }).tap(function (result) {
          result.y.should.equal('foobar');
        });
      });
    });

    describe('.map(selector, filter)', function () {
      it('returns an array of results from applying the filter to each selected element', function () {
        return parse(simpleMarkup, function () {
          return this.map('*', function ($el) {
            return $el.text();
          });
        }).tap(function (result) {
          result[0].should.equal('1');
          result[1].should.equal('2');
        });
      });
    });
  });

  describe('array filter', function () {
    it('acts as a shorthand to applying the .map() method within a function filter', function () {
      return parse(simpleMarkup, ['*', function ($el) {
        return $el.text();
      }]).tap(function (result) {
        result[0].should.equal('1');
        result[1].should.equal('2');
      });
    });

    it('allows passing a 3rd argument in the array, which is applied as a filter post parsing', function () {
      return parse(simpleMarkup, ['*', function ($el) {
        return $el.text();
      }, function (items) {
        return _.filter(items, function (item) {
          if (item === '2') {
            return true;
          }
        });
      }]).tap(function (result) {
        result.length.should.equal(1);
        result[0].should.equal('2');
      });
    });
  });
});
