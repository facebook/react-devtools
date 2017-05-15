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

function isValidRegex(needle: ?string): boolean {
  let isValid = true;

  if (needle) {
    try {
      searchTextToRegExp(needle);
    } catch (error) {
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Convert the specified search text to a RegExp.
 */
function searchTextToRegExp(needle: string): RegExp {
  return new RegExp(trimSearchText(needle), 'gi');
}

/**
 * Should the current search text be converted to a RegExp?
 */
function shouldSearchUseRegex(needle: ?string): boolean {
  return !!needle && needle.charAt(0) === '/' && trimSearchText(needle).length > 0;
}

/**
 * '/foo/' => 'foo'
 * '/bar' => 'bar'
 * 'baz' => 'baz'
 */
function trimSearchText(needle: string): string {
  if (needle.charAt(0) === '/') {
    needle = needle.substr(1);
  }
  if (needle.charAt(needle.length - 1) === '/') {
    needle = needle.substr(0, needle.length - 1);
  }
  return needle;
}

module.exports = {
  isValidRegex,
  searchTextToRegExp,
  shouldSearchUseRegex,
  trimSearchText,
};
