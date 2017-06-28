'use strict';

const should = require('should');
const { parse } = require('..');

describe('parse method', () => {
  describe('constant as parser', () => {
    describe('if constant is used as the parser', () => {
      it('returns constant as the result', () => {
        const CONSTANT = 'foo';
        parse('', CONSTANT).should.equal(CONSTANT);
        parse('', { x: CONSTANT }).x.should.equal(CONSTANT);
      });
    });
  });

  describe('function as parser', () => {
    describe('if a constant is returned', () => {
      it('uses the constant as the result', () => {
        const CONSTANT = '12345';
        parse('', () => CONSTANT).should.equal(CONSTANT);
      });
    });

    describe('if an object is returned', () => {
      it('uses the object as a parser in the same context', () => {
        const HEADER = 'Hello';
        const AFTER = '!';

        parse(`<h1>${HEADER}</h1>`, $doc => {
          const after = AFTER; // Testing the closure

          return {
            header: $doc => {
              return $doc.find('h1').text() + after;
            }
          };
        }).header.should.equal(HEADER + AFTER);
      });
    });

    describe('if an array is returned', () => {
      it('uses the array as a parser in the same context', () => {
        const HEADER = 'Hello';
        const AFTER = '!';

        parse(`<h1>${HEADER}</h1>`, $doc => {
          const after = AFTER; // Testing the closure
          return ['h1', $h1 => $h1.text() + after];
        })[0].should.equal(HEADER + AFTER);
      });

      it('recognizes and returns arrays of values', ()  => {
        const VALUES = ['1', '2'];
        parse('', $doc => VALUES).join(' ').should.equal(VALUES.join(' '));
      });
    });

    describe('if a function is returned', () => {
      it('uses the function as a parser in the same context', () => {
        const HEADER = 'foo';
        const AFTER = 'bar';

        parse(`<h1>${HEADER}</h1>`, $doc => {
          const after = AFTER; // Testing the closure
          return $doc => $doc.find('h1').text() + after;
        }).should.equal(HEADER + AFTER);
      });
    });
  });

  describe('array as parser', () => {
    describe('if a function is used as a subparser', () => {
      it('maps the function parser against each matched element', () => {
        const results = parse(`
          <ul>
            <li>1</li>
            <li>2</li>
          </ul>
        `, ['li', $li => +$li.text()]);

        results[0].should.equal(1);
        results[1].should.equal(2);
      });
    });

    describe('if an object is used as a subparser', () => {
      it('maps the object parser against each matched element', () => {
        const results = parse(`
          <ul>
            <li data-x="1">2</li>
            <li data-x="3">4</li>
          </ul>
        `, ['li', {
          x: $li => +$li.attr('data-x'),
          y: $li => +$li.text()
        }]);

        results[0].x.should.equal(1);
        results[0].y.should.equal(2);
        results[1].x.should.equal(3);
        results[1].y.should.equal(4);
      });
    });

    describe('if an array is used as a subparser', () => {
      it('maps the array parser against each matched element', () => {
        const results = parse(`
          <ul>
            <li>1</li>
          </ul>
          <ul>
            <li>2</li>
          </ul>
        `, ['ul', ['li', $li => +$li.text()]]);

        // [ [ 1 ], [ 2 ] ]
        results[0][0].should.equal(1);
        results[1][0].should.equal(2);
      });
    });
  });

  describe('object as parser', () => {
    it('maps each value as a parser in that parsing context', () => {
      const result = parse(`
        <div id="test-div" data-x="999">
          <ul>
            <li>0</li>
            <li>1</li>
          </ul>
        </div>
      `, {
        x: $doc => +$doc.find('#test-div').attr('data-x'),
        vals: ['li', $li => +$li.text()]
      });

      result.x.should.equal(999);
      result.vals[0].should.equal(0);
      result.vals[1].should.equal(1);
    });
  });
});
