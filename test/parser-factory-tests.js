'use strict';

const should = require('should');

const {
  parse,
  StringParser,
  AttributeParser,
  NumberParser
} = require('..');

describe('parser factories', () => {
  describe('StringParser', () => {
    it('should return the text of the context element', () => {
      const [a, b] = parse(`
        <div>foo</div>
        <div>bar</div>
      `, ['div', StringParser()]);

      a.should.equal('foo');
      b.should.equal('bar');
    });

    it('with selector should return sub-element text', () => {
      parse('<div id="s">hello</div>', StringParser('#s')).should.equal('hello');
    });
  });

  describe('NumberParser', () => {
    it('should return text cast as a number', () => {
      const [a, b] = parse(`
        <div>1</div>
        <div>0.5</div>
      `, ['div', NumberParser()]);

      a.should.equal(1);
      b.should.equal(0.5);
    });

    it('with selector should return sub-element text cast as a number', () => {
      parse('<div id="n">1</div>', NumberParser('#n')).should.equal(1);
    });
  });

  describe('AttributeParser', () => {
    it('should return the named attribute of the context element', () => {
      const [a, b] = parse(`
        <div class="foo"></div>
        <div class="bar"></div>
      `, ['div', AttributeParser('class')]);

      a.should.equal('foo');
      b.should.equal('bar');
    });

    it('with selector should return named attribute of the sub-element', () => {
      parse('<div id="n"></div>', AttributeParser('id', 'div')).should.equal('n');
    });
  });
});
