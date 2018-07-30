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

export const isStorageApiAvailable =
  typeof chrome !== 'undefined' &&
  chrome !== null &&
  typeof chrome === 'object' &&
  chrome.storage !== null &&
  typeof chrome.storage === 'object';

export function get(key: any, defaultValue: any = null): Promise<any> {
  if (!isStorageApiAvailable) {
    return Promise.resolve(defaultValue);
  }

  return new Promise(resolve =>
    (chrome: any).storage.local.get([key], ({[key]: value}) =>
      value === undefined
        ? resolve(defaultValue)
        : resolve(value)
    )
  );
}

export function set(key: any, value: any): Promise<any> {
  if (!isStorageApiAvailable) {
    return Promise.resolve();
  }

  return new Promise(resolve =>
    (chrome: any).storage.local.set({[key]: value}, resolve)
  );
}
