/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. a additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.dontMock('../immutableUtils');
jest.dontMock('immutable');
var immutableUtils = require('../immutableUtils'),
    Immutable = require('immutable');

describe('immutableUtils', () => {

  describe('getImmutableName()', function() {
    it('generates the right name for an OrderedMap', () => {
      var name = immutableUtils.getImmutableName(Immutable.OrderedMap());
      expect(name).toBe('Immutable.OrderedMap');
    });

    it('generates the right name for an OrderedSet', () => {
      var name = immutableUtils.getImmutableName(Immutable.OrderedSet());
      expect(name).toBe('Immutable.OrderedSet');
    });

    it('generates the right name for a Map', () => {
      var name = immutableUtils.getImmutableName(Immutable.Map());
      expect(name).toBe('Immutable.Map');
    });

    it('generates the right name for a Set', () => {
      var name = immutableUtils.getImmutableName(Immutable.Set());
      expect(name).toBe('Immutable.Set');
    });

    it('generates the right name for a List', () => {
      var name = immutableUtils.getImmutableName(Immutable.List());
      expect(name).toBe('Immutable.List');
    });

    it('generates the right name for a Stack', () => {
      var name = immutableUtils.getImmutableName(Immutable.Stack());
      expect(name).toBe('Immutable.Stack');
    });

    it('generates the right name for a Seq', () => {
      var name = immutableUtils.getImmutableName(Immutable.Seq());
      expect(name).toBe('Immutable.Seq');
    });
  });

  describe('shallowToJS()', function() {
    it('converts a Map correctly', function() {
      var map = Immutable.Map({
        a: 1,
        b: 2,
        c: Immutable.Map()
      });
      var result = immutableUtils.shallowToJS(map);
      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
      expect(Immutable.Map.isMap(result.c)).toBe(true);
    });

    it('converts a List correctly', function() {
      var list = Immutable.List(['a', 'b', Immutable.Map()]);
      var result = immutableUtils.shallowToJS(list);
      expect(result[0]).toBe('a');
      expect(result[1]).toBe('b');
      expect(Immutable.Map.isMap(result[2])).toBe(true);
    });

    it('converts a Set correctly', function() {
      var set = Immutable.Set([1, 2, 3, Immutable.List()]);
      var result = immutableUtils.shallowToJS(set);

      expect(Array.isArray(result)).toBe(true);
      expect(result.filter(Immutable.List.isList).length > 0).toBe(true);
    });
  });

});
