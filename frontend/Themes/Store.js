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

/**
 * Bump version number any time a non-backwards compatible change is made to theme-storage.
 */
const LOCAL_STORAGE_VERSIONED_KEY = 'themeName.1';

function get(): ?string {
  let themeName;

  try {
    themeName = localStorage.getItem(LOCAL_STORAGE_VERSIONED_KEY);
  } catch (error) {
    console.error('Could not read saved theme.', error);
  }

  return themeName || null;
}

function set(themeName: ?string): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_VERSIONED_KEY, themeName || '');

    return true;
  } catch (error) {
    console.error('Could not save theme.', error);
  }

  return false;
}

module.exports = {
  get: get,
  set: set,
};
