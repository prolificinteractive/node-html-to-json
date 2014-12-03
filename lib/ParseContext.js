var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var Q = require('q');

function ParseContext(options) {
  var context = this;

  _.defaults(this, options, {
    $container: null,
    $: null,
    filter: {},
    data: {},
    parent: null
  });

  this.events = new EventEmitter();
  this.__result = {};
}

ParseContext.prototype.parse = function (callback) {
  var promise;

  if (_.isFunction(this.filter)) {
    promise = this._filterWithFunction();
  } else if (_.isArray(this.filter)) {
    promise = this._filterWithArray();
  } else if (_.isObject(this.filter)) {
    promise = this._filterWithObject();
  } else {
    promise = this._filterWithConstant();
  }

  if (callback) {
    promise.done(function (val) {
      callback(null, val);
    }, function (err) {
      callback(err, null);
    });
  }

  return promise;
};

ParseContext.prototype.map = function (selector, filter) {
  var _this = this;
  var $ = this.$;
  var data = this.data;
  var $els = this.$container.find(selector);

  return Q.Promise(function (resolve, reject) {
    var arr = [];
    var subpromises = [];

    $els.each(function (i) {
      var subcontext = new ParseContext({
        $container: $(this),
        $: $,
        data: data,
        filter: filter,
        parent: _this
      });

      var subpromise = subcontext.parse();

      // Inherit parent context's events
      subcontext.events = _this.events;

      subpromise.then(function (data) {
        arr[i] = data;
      });

      subpromises.push(subpromise);
    });

    Q.all(subpromises).done(function () {
      resolve(arr);
    }, reject);
  });
};

ParseContext.prototype.get = function (key) {
  var events = this.parent.events;
  var result = this.__result;
  var value = result[key];

  if (typeof value !== 'undefined') {
    return Q(value);
  } else {
    return Q.Promise(function (resolve, reject) {
      events.once('key:' + key, resolve);
    });
  }
};

ParseContext.prototype.Promise = function (handler) {
  var _this = this;

  return Q.Promise(function (resolve, reject, notify) {
    handler.call(_this, resolve, reject, notify);
  });
};

ParseContext.prototype._filterWithFunction = function () {
  return Q(this.filter(this.$container, this.$, this.$data));
};

ParseContext.prototype._filterWithObject = function () {
  var _this = this;
  var $ = this.$;
  var data = this.data;
  var filter = this.filter;
  var $container;
  var result = this.__result = {};

  if (filter.$container) {
    $container = this.$(filter.$container);
    delete filter.$container;
  } else {
    $container = this.$container;
  }

  return Q.Promise(function (resolve, reject) {
    var subpromises = [];

    _.each(filter, function (subfilter, key) {
      var subcontext = new ParseContext({
        $container: $container,
        $: $,
        data: data,
        filter: subfilter,
        parent: _this
      });

      var subpromise = subcontext.parse();

      // Inherit parent context's events
      subcontext.events = _this.events;

      subpromise.done(function (value) {
        result[key] = value;
        subcontext.events.emit('key:' + key, value);
      });

      subpromises.push(subpromise);
    });

    Q.all(subpromises).done(function () {
      resolve(result);
    }, reject);
  });
};

ParseContext.prototype._filterWithArray = function () {
  return this.map(this.filter[0], this.filter[1]);
};

ParseContext.prototype._filterWithConstant = function () {
  return Q(this.filter);
};

module.exports = ParseContext;
