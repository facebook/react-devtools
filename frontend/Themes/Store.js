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
const {getSafeThemeName} = require('./utils');

const LOCAL_STORAGE_VERSIONED_KEY = 'themeName';

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
    const themeName = getSafeThemeName(this._get(), this.defaultThemeName);

    this.theme = Themes[themeName];
    this.themeName = themeName;
    this.themes = Themes;
  }

  update(themeName: ?string) {
    // Only apply a valid theme.
    const safeThemeKey = getSafeThemeName(themeName, this.defaultThemeName);

    this.theme = this.themes[safeThemeKey];
    this.themeName = safeThemeKey;

    // But allow users to restore "default" mode by selecting an empty theme.
    this._set(themeName || null);
  }

  _get(): ?string {
    let themeName;

    try {
      themeName = localStorage.getItem(LOCAL_STORAGE_VERSIONED_KEY);
    } catch (error) {
      console.error('Could not read saved theme.', error);
    }

    return themeName || null;
  }

  _set(themeName: ?string): boolean {
    try {
      localStorage.setItem(LOCAL_STORAGE_VERSIONED_KEY, themeName || '');

      return true;
    } catch (error) {
      console.error('Could not save theme.', error);
    }

    return false;
  }
}

module.exports = Store;
