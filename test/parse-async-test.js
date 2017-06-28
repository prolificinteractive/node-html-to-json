'use strict';

const bluebird = require('bluebird');
const { parseAsync } = require('..');

describe('parseAsync method', () => {
  it('allows parsers to return promises', () => {
    return parseAsync(`
      <ul data-x="0">
        <li>foobar</li>
      </ul>
    `, {
      x: $doc => bluebird.resolve(+$doc.find('ul').attr('data-x')),
      vals: ['li', {
        text: $li => bluebird.resolve($li.text())
      }]
    }).tap(({ x, vals }) => {
      x.should.equal(0);
      vals[0].text.should.equal('foobar');
    });
  });
});
