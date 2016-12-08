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

jest.dontMock('../Agent');
var Agent = require('../Agent');

describe('Agent', () => {

  it('does not overwrite existing global $r', () => {
    const instance = new Agent({
      $r: 'exists',
    });
    const expected = '$$r';
    const actual = instance._getGlobalRName();
    expect(actual).toBe(expected);
  });

  it('it finds a suitable $r name when there are multiple conflicts', () => {
    const instance = new Agent({
      $r: 'exists',
      $$r: 'exists',
      $$$r: 'exists',
    });
    const expected = '$$$$r';
    const actual = instance._getGlobalRName();
    expect(actual).toBe(expected);
  });

});
