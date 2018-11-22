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

const {deserialize, serialize} = require('./Serializer');
const Themes = require('./Themes');
const {CUSTOM_THEME_NAME} = require('./constants');
const {get, set} = require('../../utils/storage');
const Fonts = require('./Fonts');

const LOCAL_STORAGE_CUSTOM_THEME_KEY = 'customTheme';
const LOCAL_STORAGE_THEME_NAME_KEY = 'themeName';

import type {Theme} from '../types';

class Store {
  customTheme: Theme;
  defaultThemeName: string;
  theme: Theme;
  themeName: string;
  themes: { [key: string]: Theme };

  constructor(defaultThemeName: ?string) {
    this.themes = Themes;

    // Load previous custom theme from localStorage.
    // If there isn't one in local storage, start by cloning the default theme.
    const customTheme = get(LOCAL_STORAGE_CUSTOM_THEME_KEY);
    if (customTheme) {
      this.customTheme = deserialize(customTheme);
    }

    this.setDefaultTheme(defaultThemeName);

    updateFontVariables(Fonts);
  }

  setDefaultTheme(defaultThemeName: ?string) {
    // Don't accept an invalid themeName as a default.
    this.defaultThemeName = getSafeThemeName(defaultThemeName);

    // Don't restore an invalid themeName.
    // This guards against themes being removed or renamed.
    const themeName = getSafeThemeName(
      get(LOCAL_STORAGE_THEME_NAME_KEY),
      this.defaultThemeName,
    );

    // The user's active theme is either their custom one,
    // Or one of the built-in sets (based on the default).
    this.theme = themeName === CUSTOM_THEME_NAME ? this.customTheme : Themes[themeName];
    this.themeName = themeName;

    updateCSSVariables(this.theme);
  }

  update(themeName: ?string) {
    if (themeName === CUSTOM_THEME_NAME) {
      this.theme = this.customTheme;
      this.themeName = CUSTOM_THEME_NAME;
    } else {
      // Only apply a valid theme.
      const safeThemeKey = getSafeThemeName(themeName, this.defaultThemeName);

      this.theme = this.themes[safeThemeKey];
      this.themeName = safeThemeKey;
    }

    // But allow users to restore "default" mode by selecting an empty theme.
    set(LOCAL_STORAGE_THEME_NAME_KEY, themeName || null);

    updateCSSVariables(this.theme);
  }

  saveCustomTheme(theme: Theme) {
    this.customTheme = theme;
    this.theme = theme;

    set(LOCAL_STORAGE_CUSTOM_THEME_KEY, serialize(theme));

    updateCSSVariables(theme);
  }
}

function updateCSSVariables(theme: Theme): void {
  for (const key in theme) {
    // $FlowFixMe
    document.body.style.setProperty(`--theme-${key}`, theme[key]);
  }
}

function updateFontVariables({ monospace, sansSerif }) {
  // $FlowFixMe
  const {style} = document.body;
  style.setProperty('--font-family-mono', monospace.family);
  style.setProperty('--font-size-mono-normal', monospace.sizes.normal + 'px');
  style.setProperty('--font-size-mono-large', monospace.sizes.large + 'px');
  style.setProperty('--font-family-sans', sansSerif.family);
  style.setProperty('--font-size-sans-small', sansSerif.sizes.small + 'px');
  style.setProperty('--font-size-sans-normal', sansSerif.sizes.normal + 'px');
  style.setProperty('--font-size-sans-large', sansSerif.sizes.large + 'px');
}

function getSafeThemeName(themeName: ?string, fallbackThemeName: ?string): string {
  if (themeName === CUSTOM_THEME_NAME) {
    return CUSTOM_THEME_NAME;
  } else if (
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

module.exports = Store;
