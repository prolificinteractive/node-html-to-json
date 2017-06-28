# html-to-json

Concise HTML data parsing, built on top of `cheerio`.

## Installation

```
npm install html-to-json --save
```

## Introduction

After `cheerio` came along, parsing data from HTML on the server (aka scraping) became a much easier task. `html-to-json` takes it one step further by allowing you to construct parsing functions that take on the same shape of the data they produce.

For instance:

```javascript
const parseSearchPage = html => parse(html, {
  'relatedCategories': ['nav .category', $c => $c.text()],
  'products': ['.product', $p => ({
    'id': $p.attr('data-id'),
    'name': $p.find('.product-name').text().trim(),
    'url': $p.find('a').attr('href'),
    'images': ['img[data-lazy-url]', $i => $i.attr('data-lazy-url')]
  })]
});
```

Versus...

```javascript
const parseSearchPage = html => {
  const $ = cheerio.load(html);

  const relatedCategories = $('nav .category').map((i, c) => {
    return $(c).text();
  });

  const products = $('.product').map((i, p) => {
    const $p = $(p);
    return {
      'id': $p.attr('data-id'),
      'name': $p.find('.product-name').text().trim(),
      'url': $p.find('a').attr('href'),
      'images': $p.find('img[data-lazy-url]').map((i, img) => {
        return $(img).attr('data-lazy-url');
      })
    };
  });

  return {
    relatedCategories,
    products
  };
};
```

## Usage

### Synchronous Parsing

By default, parsers are synchronous:

```javascript
'use strict';

const bluebird = require('bluebird');
const requestAsync = bluebird.promisify(require('request'));
const { parse } = require('html-to-json');

const parseCartItems = html => parse(html, ['#cart li', {
  'id': $li => $li.attr('data-id'),
  'name': $li => $li.find('.name').text(),
  'quantity': $li => +$li.find('.qty').text()
}]);

const getCartItems = jar => {
  return requestAsync({
    uri: 'https://shop.prolificinteractive.com/cart',
    jar
  }).then(parseCartItems);
};

// Assume we have a jar object...
getCartItems(myJar).done(items => {
  // Should return a list of cart items
});
```

### Asynchronous Parsing

You can also return promises from your parsers by using `parseAsync`. However, we recommend synchronous parsers, as they tend to be pure and more testable.

An example:

```javascript
'use strict';

const bluebird = require('bluebird');
const requestAsync = bluebird.promisify(require('request'));
const { parseAsync } = require('html-to-json');

const getCartItems = jar => {
  return requestAsync({
    uri: 'https://shop.prolificinteractive.com/cart',
    jar
  }).then(parseCartItems);
};

const getProductInfo = id => {
  return requestAsync({
    uri: `https://shop.prolificinteractive.com/products/${id}`
  }).then(parseProductDetails);
};

const parseProductDetails = html => parse(html, {
  'id': $doc => $doc.find('#product-id').text(),
  'name': $doc => $doc.find('#product-name').text(),
  'description': $doc => $doc.find('article#description').text().trim();
});

const parseCartItems = html => parse(html, ['#cart li', $li => {
  const id = $li.attr('data-id');

  return {
    id,
    'name': $li.find('.name').text(),
    'quantity': +$li.find('.qty').text(),
    'description': () => getProductInfo(id).get('description')
  };
}]);

// Assume we have a jar object...
getCartItems(myJar).done(items => {
  // Should return a list of cart items with product descriptions
});
```

## API

### `parse`

```javascript
parse(
  context, // HTML string or cheerio object
  parser   // See the types below.
) -> Any   // Returns any kind of value
```

#### Parser Types

##### Parser Functions

Functions may return a value or another parser, which allows you to cache values and use them within the closure.

```javascript
// Returning a value
parse('<h1>Hello</h1>', $doc => {
  return $doc.find('h1').text();
}); // -> "Hello"

// Returning an inner parser. Keeps the same parsing context.
parse(`
  <ul data-x="5">
    <li>1</li>
    <li>10</li>
    <li>500</li>
  </ul>
`, $doc => {
  const x = +$doc.find('ul').attr('data-x');
  return ['li', $li => +$li.text() * x]; // Used as a parser array
}); // -> [5, 50, 2500]
```

##### Parser Objects

For objects, each property's value is used as a parser, and the result is stored against the same key:

```javascript
parse(`
  <div id="foo">foo</div>
  <div id="bar">bar</div>
`, {
  foo: $doc => {
    return $doc.find('#foo').text();
  },
  bar: $doc => {
    return $doc.find('#bar').text();
  },
  one: 1,
  divs: ['div', {
    id: $div => $div.attr('id')
  }]
}); // -> { foo: "foo", bar: "bar", one: 1, divs: [{ id: "foo" }, { id: "bar" }] }
```

##### Parser Arrays

This library uses a shorthand syntax to map matched elements to values.

```javascript
parse(`
  <div class="product" data-product-id="1">
    <div class="name">Product 1</div>
  </div>
  <div class="product" data-product-id="2">
    <div class="name">Product 2</div>
  </div>
`, ['.product', {
  id: $p => $p.attr('data-product-id'),
  name: $p => $p.text()
}]); // -> [{ id: "1", name: "Product 1" }, { id: "2", name: "Product 2"}]
```

##### Parser Constants

Numbers, strings, and booleans are used as the result. This is, for instance, helpful for mocking out parsers.

```javascript
parse(`
  <div class="product" data-product-id="1">
    <div class="name">Product 1</div>
  </div>
  <div class="product" data-product-id="2">
    <div class="name">Product 2</div>
  </div>
`, ['.product', {
  id: $p => $p.attr('data-product-id'),
  name: 'Mock Product'
}]);  // -> [{ id: "1", name: "Mock Product" }, { id: "2", name: "Mock Product"}]
```

### `parseAsync`

```javascript
parseAsync(
  context,  // HTML string or cheerio object
  parser    // Same as parse(), but may return promises
) -> Promise
```

### Parser Factories

`html-to-json` also provides factories for common parsing functions:

```javascript
const parseProducts = parse(html, ['.product', {
  id: AttributeParser('data-product-id'),
  name: StringParser('.name'),
  price: NumberParser('.price')
}]);

parseProducts(`
  <div class="product" data-product-id="1">
    <div class="name">Product 1</div>
    <div class="price">10.50</div>
  </div>
  <div class="product" data-product-id="2">
    <div class="name">Product 2</div>
    <div class="price">$30.00</div>
  </div>
`);  // -> [{ id: "1", name: "Product 1", price: 10.5 }, { id: "2", name: "Product 2", price: 30 }]
```

#### `StringParser`

`StringParser([selector]) -> Function`

Equivalent to `$el => $el.text().trim()`. If you pass a selector, it uses the first selected element, equivalent to `$el => $el.find(selector).eq(0).text().trim()`.

#### `NumberParser`

`NumberParser([selector]) -> Function`

Extracts a number. If you pass a selector, it selects the first matching element and extracts a number from it.

#### `AttributeParser`

`AttributeParser(name, [selector]) -> Function`

Equivalent to `$el => $el.attr(name)`. If you pass a selector, it is equivalent to `$el => $el.find(selector).eq(0).attr(name)`.
