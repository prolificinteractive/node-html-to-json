# htmlToJson

Parses HTML strings into objects using flexible, composable filters.

## Installation

`npm install html-to-json`

## htmlToJson.parse(html, filter, [callback])

The `parse()` method takes a string of HTML, and a filter, and responds with the filtered data. This supports both callbacks and promises.

```javascript
var promise = htmlToJson.parse('<div>content</div>', {
  'text': function ($doc) {
    return $doc.find('div').text();
  }
}, function (err, result) {
  console.log(result);
});

promise.done(function (result) {
  //Works as well
});
```

## htmlToJson.request(requestOptions, filter, [callback])

The `request()` method takes options for a call to the [request](https://github.com/request/request) library and a filter, then returns the filtered response body.

```javascript
var promise = htmlToJson.request('http://prolificinteractive.com/team', {
  'images': ['img', function ($img) {
    return $img.attr('src');
  }]
}, function (err, result) {
  console.log(result);
});
```

## Filter Types

### Functions

The return values of functions are mapped against their corresponding keys. Function filters are passed [cheerio](https://github.com/cheeriojs/cheerio) objects, which allows you to play with a jQuery-like interface.

```javascript
htmlToJson.parse('<div id="foo">foo</div>', {
  'foo1': function ($doc, $) {
    return $doc.find('#foo').text(); //foo
  }
}, callback);
```

### Arrays

Arrays of data can be parsed out by either using the .map() method within a filter function or using the shorthand [selector, filter] syntax:

#### .map(selector, filter)

A filter is applied incrementally against each matched element, and the results are returned within an array.

```javascript
var html = '<div id="items"><div class="item">1</div><div class="item">2</div></div>';

htmlToJson.parse(html, function () {
  return this.map('.item', function ($item) {
    return $item.text();
  });
}).done(function (items) {
  // Items should be: ['1','2']
}, function (err) {
  // Handle error
});
```

#### [selector, filter, after]

This is essentially a short-hand alias for `.map()`, making the filter look more like its output:

```javascript
var html = '<div id="items"><div class="item">1</div><div class="item">2</div></div>';

htmlToJson.parse(html, ['.item', function ($item) {
  return $item.text();
}]).done(function (items) {
  // Items should be: ['1','2']
}, function (err) {
  // Handle error
});
```

As an added convenience you can pass in a 3rd argument into the array filter, which allows you to manipulate the results. You can return a promise if you wish to do an asynchronous operation.

```javascript
var html = '<div id="items"><div class="item">1</div><div class="item">2</div></div>';

htmlToJson.parse(html, ['.item', function ($item) {
  return +$item.text();
}, function (items) {
  return _.map(items, function (item) {
    return item * 3;
  });
}]).done(function (items) {
  // Items should be: [3,6]
}, function (err) {
  // Handle error
});
```

### Asynchronous filters

Filter functions may also return promises, which get resolved asynchronously.

```javascript
function getProducts (callback) {
  return htmlToJson.request({
    uri: 'http://store.prolificinteractive.com'
  }, ['.product', {
    'id': function ($product) {
      return $product.attr('data-id');
    },
    'image': function ($product) {
      return $product.find('img').attr('src');
    },
    'colors': function ($product) {
      return this.get('id').then(function (id) {
        return getProductDetails(id).get('colors');
      });
    }
  }], callback);
}

function getProductDetails (id, callback) {
  return htmlToJson.request({
    uri: 'http://store.prolificinteractive.com/products/' + id
  }, {
    'id': function ($doc) {
      return $doc.find('#product-details').attr('data-id');
    },
    'colors': ['.color', {
      'id': function ($color) {
        return $color.attr('data-id');
      },
      'hex': function ($color) {
        return $color.css('background-color');
      }
    }]
  }, callback);
}
```

### Dependencies on other values

Filter functions may use the .get(propertyName) to use a value from another key in that filter. This returns a promise representing the value rather than the value itself.

```javascript
function getProducts (callback) {
  return htmlToJson.request('http://store.prolificinteractive.com', ['.product', {
    'id': function ($product) {
      return $product.attr('data-id');
    },
    'image': function ($product) {
      return $product.find('img').attr('src');
    },
    'colors': function ($product) {
      // Resolve 'id' then get product details with it
      return this.get('id').then(function (id) {
        return getProductDetails(id).get('colors');
      });
    }
  }], callback);
}
```

### Objects

Nested objects within a filter are run against the same HTML context as the parent filter.

```javascript
var html = '<div id="foo"><div id="bar">foobar</div></div>';

htmlToJson.parse(html, {
  'foo': {
    'bar': function ($doc) {
      return $doc.find('#bar').text();
    }
  }
});
```

#### $container modifier

You may specify a more specific DOM context by setting the $container property on the object filter:

```javascript
var html = '<div id="foo"><div id="bar">foobar</div></div>';

htmlToJson.parse(html, {
  'foo': {
    $container: '#foo',
    'bar': function ($foo) {
      return $foo.find('#bar').text();
    }
  }
});
```

### Constants

Strings, numbers, and null values are simply used as the filter's value.

```javascript
htmlToJson.parse('<div id="nada"></div>', {
  x: 1,
  y: 'string value',
  z: null
});
```

## htmlToJson.createParser(filter), new htmlToJson.Parser(filter)

For the sake of reusability, creates an object with `.parse` and `.request` helper methods, which use the passed filter. For example:

```javascript
var linkParser = htmlToJson.parser(['a[href]', {
  'text': function ($a) {
    return $a.text();
  },
  'href': function ($a) {
    return $a.attr('href');
  }
}]);

linkParser.request('http://prolificinteractive.com').done(function (links) {
  //Do stuff with links
});
```

is equivalent to:

```javascript
linkParser.request('http://prolificinteractive.com', ['a[href]', {
  'text': function ($a) {
    return $a.text();
  },
  'href': function ($a) {
    return $a.attr('href');
  }
}]).done(function (links) {
  //Do stuff with links
});
```

The former allows you to easily reuse the filter (and make it testable), while that latter is a one-off.

### parser.parse(html, [callback])

Parses the passed html argument against the parser's filter.

### parser.method(html, [callback])

Returns a method that wraps `parser.parse()`

### parser.request(requestOptions, [callback])

Makes a request with the request options, then runs the response body through the parser's filter.

## Contributing

First make sure you have the grunt command line installed globally:

`sudo npm install -g grunt-cli`

### Running Tests

Tests are written in mocha and located in the `test` directory. Run them with grunt:

`grunt test`

### Code Standards

#### Linting

Before committing, run `grunt lint` and fix any warnings.

#### Style

Before committing, make sure to run `grunt beautify`.
