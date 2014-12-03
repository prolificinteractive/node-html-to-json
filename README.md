# htmlToJson

Parses HTML strings into objects using flexible, composable filters.

## Installation

`npm install htmlToJson`

## htmlToJson.parse(html, filter, [data], [callback])

The `parse()` method takes a string of HTML, a filter, optional data, and responds with the filtered data. This supports both callbacks and promises.

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

## htmlToJson.request(requestOptions, filter, [data], [callback])

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
  'foo1': function ($doc, $, data) {
    return $doc.find('#foo').text() + data.bar; //foobar
  },
  'foo2': function () {
    return this.$('#foo').text() + this.data.bar; //foobar, using context instead
  }
}, { bar: 'bar' });
```

### Arrays

Arrays of data can be parsed out by either using the .map() method within a filter function or using the shorthand [selector, filter] syntax:

#### .map(selector, filter)

A filter is applied incrementally against each matched element, and the results are returned within an array.

```javascript
var html = '<div id="items"><div clas="item">1</div><div clas="item">2</div></div>';

htmlToJson.parse(html, function () {
  return this.map('.item', function ($item) {
    return $item.text();
  });
}).done(function (items) {
  // Items should be: ['1','2']
}, function (err) {
  // Handle error
});
````

#### [selector, filter]

This is essentially a short-hand alias for `.map()`, making the filter look more like its output:

```javascript
var html = '<div id="items"><div clas="item">1</div><div clas="item">2</div></div>';

htmlToJson.parse(html, ['.item', function ($item) {
  return $item.text();
}]).done(function (items) {
  // Items should be: ['1','2']
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
