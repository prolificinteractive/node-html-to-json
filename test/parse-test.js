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
      return parse(simpleMarkup, function () {
        return 1;
      }).tap(function (result) {
        result.should.equal(1);
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
    it('iterates through each key and recursively uses the values as filters', function (done) {
      parse(simpleMarkup, {
        x: 1,
        y: 2
      }, function (err, result) {
        result.x.should.equal(1);
        result.y.should.equal(2);
        done();
      });
    });

    describe('$container modifier', function () {
      it('sets the DOM context to elements matched by $container selector', function (done) {
        parse(simpleMarkup, {
          $container: '.bar',
          'id': function ($el) {
            return $el.attr('class');
          }
        }, function (err, result) {
          result.id.should.equal('bar');
          done();
        });
      });
    });
  });

  describe('filter context methods', function () {
    describe('.Promise(fn)', function () {
      it('takes a promise container function and returns a promise', function (done) {
        parse('', function () {
          return this.Promise(function (resolve) {
            resolve(1);
          });
        }, function (err, result) {
          result.should.equal(1);
          done();
        });
      });
    });

    describe('.get(property)', function () {
      it('returns a promise that is resolved whenever the given property is resolved', function (done) {
        parse('', {
          'x': function () {
            return this.Promise(function (resolve) {
              resolve('foo');
            });
          },
          'y': function () {
            return this.get('x').then(function (x) {
              return x + 'bar';
            });
          }
        }, function (err, result) {
          result.y.should.equal('foobar');
          done();
        });
      });
    });

    describe('.map(selector, filter)', function () {
      it('returns an array of results from applying the filter to each selected element', function (done) {
        parse(simpleMarkup, function () {
          return this.map('*', function ($el) {
            return $el.text();
          });
        }, function (err, result) {
          result[0].should.equal('1');
          result[1].should.equal('2');
          done();
        });
      });
    });
  });

  describe('array filter', function () {
    it('acts as a shorthand to applying the .map() method within a function filter', function (done) {
      parse(simpleMarkup, ['*', function ($el) {
        return $el.text();
      }], function (err, result) {
        result[0].should.equal('1');
        result[1].should.equal('2');
        done();
      });
    });
  });
});
