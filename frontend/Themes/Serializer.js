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

const {ChromeDefault} = require('./Themes');

import type {Theme} from '../types';

const themeKeys = Object.keys(ChromeDefault);

function deserialize(string: string, fallbackTheme: Theme = ChromeDefault): Theme {
  const theme = {};

  try {
    const maybeTheme = JSON.parse(string);

    // Make sure serialized theme has no extra keys.
    themeKeys.forEach(key => {
      const maybeColor = maybeTheme[key];
      if (isColorSet(maybeColor)) {
        theme[key] = maybeColor;
      }
    });

  } catch (error) {
    console.error('Could not deserialize theme', error);
  }

  // Update outdated custom theme formats and set reasonable defaults.
  if (!isColorSet(theme.state06)) { // Added in version > 2.3.0
    theme.state06 = theme.base05;
  }

  // Make sure serialized theme has all of the required color values.
  themeKeys.forEach(key => {
    const maybeColor = theme[key];
    if (!isColorSet(maybeColor)) {
      theme[key] = fallbackTheme[key];
    }
  });

  return ((theme: any): Theme);
}

function isColorSet(maybeColor: any): boolean {
  return typeof maybeColor === 'string' && maybeColor !== '';
}

function serialize(theme: Theme): string {
  return JSON.stringify(theme, null, 0);
}

module.exports = {
  deserialize,
  serialize,
};
