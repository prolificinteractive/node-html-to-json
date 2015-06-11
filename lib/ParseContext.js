var _ = require('lodash');
var Promise = require('bluebird');
var callbackify = require('./callbackify');

function ParseContext (options) {
  var context = this;

  _.defaults(this, options, {
    $container: null,
    $: null,
    filter: {},
    parent: null
  });

  this.promises = Object.create(this.parent? this.parent.promises: {});
}

ParseContext.prototype.parse = function (callback) {
  var promise;

  _.every(['Function', 'Array', 'Object'], function (type) {
    if (_['is' + type](this.filter)) {
      promise = this['_filterWith' + type]();
      return false;
    }

    return true;
  }, this);

  if (!promise) {
    promise = this._filterWithConstant();
  }

  return callbackify(promise, callback);
};

ParseContext.prototype.map = function (selector, filter) {
  var _this = this;
  var $ = this.$;
  var $els = this.$container.find(selector);

  var promises = _.map($els, function (el) {
    var subcontext = new ParseContext({
      $container: $(el),
      $: $,
      filter: filter,
      parent: this
    });

    return subcontext.parse();
  }, this);

  return Promise.all(promises);
};

ParseContext.prototype.get = function (key) {
  return Promise.resolve(this.promises['key:' + key]);
};

ParseContext.prototype._filterWithFunction = function () {
  return Promise.resolve(this.filter.call(this, this.$container, this.$));
};

ParseContext.prototype._filterWithObject = function () {
  var _this;
  var filter = this.filter;
  var parent = this.parent;
  var $ = this.$;
  var $container = this.$container;
  var promises = this.promises;
  var propertyMap = {};

  if (filter.$container) {
    $container = this.$(filter.$container);
    delete filter.$container;
  }

  _.each(filter, function (subfilter, key) {
    var subcontext = new ParseContext({
      $container: $container,
      $: $,
      filter: subfilter,
      parent: this
    });

    promises['key:' + key] = propertyMap[key] = new Promise(function (resolve, reject) {
      process.nextTick(function () {
        subcontext.parse().done(resolve, reject);
      });
    });
  }, this);

  return Promise.props(propertyMap);
};

ParseContext.prototype._filterWithArray = function () {
  var selector = this.filter[0];
  var eachFilter = this.filter[1];
  var afterFilter = this.filter[2];
  var result = this.map(selector, eachFilter);

  if (afterFilter) {
    return result.then(afterFilter);
  }

  return result;
};

ParseContext.prototype._filterWithConstant = function () {
  return Promise.resolve(this.filter);
};

module.exports = ParseContext;
