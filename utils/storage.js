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

export function get(key: any, defaultValue: any = null): any {
  let value;
  try {
    value = JSON.parse((localStorage.getItem(key): any));
  } catch (error) {
    console.error('Could not read from localStorage.', error);
  }
  return value !== null ? value : defaultValue;
}

export function set(key: any, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Could not write to localStorage.', error);
  }
  return false;
}
