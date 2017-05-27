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

const Themes = require('./Themes');

const LOCAL_STORAGE_THEME_NAME_KEY = 'themeName';

import type {Theme} from '../types';

class Store {
  defaultThemeName: string;
  theme: Theme;
  themeName: string;
  themes: { [key: string]: Theme };

  constructor(defaultThemeName: ?string) {
    // Don't accept an invalid themeName as a default.
    this.defaultThemeName = getSafeThemeName(defaultThemeName);

    // Don't restore an invalid themeName.
    // This guards against themes being removed or renamed.
    const themeName = getSafeThemeName(getFromLocalStorage(LOCAL_STORAGE_THEME_NAME_KEY), this.defaultThemeName);

    this.theme = Themes[themeName];
    this.themeName = themeName;
    this.themes = Themes;
  }

  update(themeName: ?string) {
    if (themeName === 'custom') {

    }

    // Only apply a valid theme.
    const safeThemeKey = getSafeThemeName(themeName, this.defaultThemeName);

    this.theme = this.themes[safeThemeKey];
    this.themeName = safeThemeKey;

    // But allow users to restore "default" mode by selecting an empty theme.
    setInLocalStorage(LOCAL_STORAGE_THEME_NAME_KEY, themeName || null);
  }
}

function getFromLocalStorage(key: string): any {
  let value;
  try {
    value = localStorage.getItem(key);
  } catch (error) {
    console.error('Could not read from localStorage.', error);
  }
  return value || null;
}

function getSafeThemeName(themeName: ?string, fallbackThemeName: ?string): string {
  if (
    themeName &&
    Themes.hasOwnProperty(themeName)
  ) {
    return themeName;
  } else if (
    fallbackThemeName &&
    Themes.hasOwnProperty(fallbackThemeName)
  ) {
    return fallbackThemeName;
  } else {
    return 'ChromeDefault';
  }
}

function setInLocalStorage(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Could not write to localStorage.', error);
  }
  return false;
}

module.exports = Store;
