'use strict';

const cheerio = require('cheerio');
const bluebird = require('bluebird');

const parse = (context, parser, $, isAsync = false) => {
  if (isConstant(parser)) {
    return isAsync
      ? bluebird.resolve(parser)
      : parser;
  }

  let $context;

  // Invoked outside the function
  if (!$) {
    $ = cheerio.load(context);
    $context = $.root();
  }

  // Invoked inside the function
  else {
    $context = $(context);
  }

  // Arrays: use the first member as a child element selector, the second as
  // a parser to map each child element against.
  if (isArray(parser)) {
    const [selector, subparser] = parser;

    // Detect non-parsers so we can return arrays as values.
    if (parser.length !== 2 || typeof selector !== 'string' || isConstant(subparser)) {
      return isAsync
        ? bluebird.all(parser)
        : parser;
    }

    const result = $context.find(selector).get().map(el => {
      return parse(el, subparser, $, isAsync);
    });

    if (isAsync) {
      return bluebird.all(result);
    }

    return result;
  }

  // Objects: treat each value as a parser, assign the result to its associated key.
  if (isObject(parser)) {
    if (parser.$container) {
      return parse($context.find(parser.$container), without(parser, '$container'), $, isAsync);
    }

    const result = Object.keys(parser).reduce((result, key) => {
      result[key] = parse($context, parser[key], $, isAsync);
      return result;
    }, {});

    if (isAsync) {
      return bluebird.props(result);
    }

    return result;
  }

  // Execute the parser with the context as an argument. Run the results
  // through the parse function so that we can have closure-enabled parsers.
  if (isFunction(parser)) {
    const result = parser($context, $);

    if (isAsync) {
      return result.then(innerParser => {
        return parse($context, innerParser, $, isAsync);
      });
    }

    return parse($context, result, $, isAsync);
  }
};

const parseAsync = (context, parser, $) => {
  return parse(context, parser, $, true);
};

const StringParser = selector => $el => {
  const _$el = selector? $el.find(selector).eq(0): $el;
  return _$el.text().trim();
};

const NumberParser = selector => $el => {
  const _$el = selector? $el.find(selector).eq(0): $el;
  return parseFloat(_$el.text().trim().match(/[0-9.]+/));
};

const AttributeParser = (name, selector) => $el => {
  const _$el = selector? $el.find(selector).eq(0): $el;
  return _$el.attr(name);
};

const without = (obj, key) => {
  const copy = Object.assign({}, obj);
  delete copy[key];
  return copy;
};

const isConstant = val => {
  return val === null || /^(string|number|boolean)$/.test(typeof val);
};

const isArray = val => {
  return Array.isArray(val);
};

const isObject = val => {
  return typeof val === 'object' && !isArray(val);
};

const isFunction = val => {
  return typeof val === 'function';
};

module.exports = {
  parse,
  parseAsync,
  StringParser,
  AttributeParser,
  NumberParser
};
