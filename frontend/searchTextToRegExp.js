/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

function searchTextToRegExp(needle: string): RegExp {
  if (needle.charAt(0) === '/') {
    needle = needle.substr(1);
  }

  if (needle.charAt(needle.length - 1) === '/') {
    needle = needle.substr(0, needle.length - 1);
  }

  return new RegExp(needle, 'i');
}

module.exports = searchTextToRegExp;
