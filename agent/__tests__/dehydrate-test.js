/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

var dehydrate = require('../dehydrate');

describe('dehydrate', () => {
  it('leaves an empty object alone', () => {
    var cleaned = [];
    var result = dehydrate({}, cleaned);
    expect(result).toEqual({});
  });

  it('preserves a shallowly nested object', () => {
    var object = {
      a: {b: 1, c: 2, d: 3},
      b: ['h', 'i', 'j'],
    };
    var cleaned = [];
    var result = dehydrate(object, cleaned);
    expect(cleaned).toEqual([]);
    expect(result).toEqual(object);
  });

  it('cleans a deeply nested object', () => {
    var object = {a: {b: {c: {d: 4}}}};
    var cleaned = [];
    var result = dehydrate(object, cleaned);
    expect(cleaned).toEqual([['a', 'b', 'c']]);
    expect(result.a.b.c).toEqual({type: 'object', name: '', meta: {}});
    expect(result.a.b.c.d).toBeUndefined(); // Dehydrated

    // Re-hydrate
    result.a.b.c = dehydrate(object.a.b.c, [], ['a', 'b', 'c']);
    expect(result).toEqual(object);
  });

  it('cleans a deeply nested array', () => {
    var object = {a: {b: {c: [1, 3]}}};
    var cleaned = [];
    var result = dehydrate(object, cleaned);
    expect(cleaned).toEqual([['a', 'b', 'c']]);
    expect(result.a.b.c).toEqual({type: 'array', name: 'Array', meta: {length: 2}});
  });

  it('cleans multiple things', () => {
    var Something = function() {};
    var object = {a: {b: {c: [1, 3], d: new Something()}}};
    var cleaned = [];
    var result = dehydrate(object, cleaned);
    expect(cleaned).toEqual([['a', 'b', 'c'], ['a', 'b', 'd']]);
    expect(result.a.b.c).toEqual({type: 'array', name: 'Array', meta: {length: 2}});
    expect(result.a.b.d).toEqual({type: 'object', name: 'Something', meta: {}});
  });

  it('returns readable name for dates', () => {
    var d = new Date();
    var object = {a: d };
    var cleaned = [];
    var result = dehydrate(object, cleaned);
    expect(result.a).toEqual({type: 'date', name: d.toString(), meta: {uninspectable: true}});
  });
});
