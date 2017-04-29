'use strict';

jest.dontMock('../index');
var transfer = require('../index');

describe('transfer.parse', () => {
  it('parses the empty object correctly', () => {
    var result = transfer.parse('{}');
    expect(result).toEqual({});
  });

  it('preserves a shallowly nested object', () => {
    var object = {
      a: {b: 1, c: 2, d: 3},
      b: ['h', 'i', 'j'],
    };
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves a deeply nested object', () => {
    var object = {a: {b: {c: {d: 4}}}};
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves a deeply nested array', () => {
    var object = {a: {b: {c: [1, 3]}}};
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves dates', () => {
    var d = new Date();
    var object = { a: d };
    var result = transfer.parse(transfer.stringify(object));
    // Dates are parsed into UTC strings like in JSON
    expect(new Date(result.a)).toEqual(object.a);
  });

  it('preserves undefined in arrays', () => {
    var object = {a: [undefined, 3, undefined, undefined, 6, 0] };
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves undefined', () => {
    var object = undefined;
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves NaN', () => {
    var object = [NaN, 3, 8];
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves Infinity', () => {
    var object = [Infinity, 3, 8];
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves -Infinity', () => {
    var object = [-Infinity, 3, 8];
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves null', () => {
    var object = [null, 3, null];
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });

  it('preserves object properties whose value is undefined', () => {
    var object = { a: undefined };
    var result = transfer.parse(transfer.stringify(object));
    expect(result).toEqual(object);
  });
});
