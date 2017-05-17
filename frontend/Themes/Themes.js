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

import type {Theme} from '../types';

/**
 * A theme is a color template used throughout devtools.
 * All devtools coloring is declared by themes, with one minor exception: status colors.
 * Themes are user-selectable (via the preferences panel) and peristed between sessions.
 *
 * New themes may be safely added without user-facing impact.
 * Renaming or removing a theme may cause user preferences to be reset on next devtools launch however.
 *
 * A few of the themes below are special purpose (ChromeDefault and ChromeDark, FirefoxDark).
 * These are flagged as "hidden", meaning that they are not directly exposed to the user.
 * Rather if the user chooses the "default" theme- they will be used to match the browser UI.
 * These themes can be exposed to the UI directly by passing a "showHiddenThemes" flag to <Panel>.
 * 
 * Before adding a new theme, refer to the Theme docs in frontend/types.
 * Each theme key has a purpose and guidelines should be followed to ensure legibility.
 */

const ChromeDark: Theme = {
  displayName: 'Chrome (dark)',
  hidden: true,
  base00: '#242424',
  base01: '#2a2a2a',
  base02: '#363636',
  base03: '#404040',
  base04: '#777777',
  base05: '#a5a5a5',
  base06: '#d5d5d5',
  base07: '#d9d9d9',
  base08: '#5db0d7',
  base09: '#a1f7b5',
  base0A: '#66ff88',
  base0B: '#f29766',
  base0C: '#d2c057',
  base0D: '#34d1c5',
  base0E: '#9a7fd5',
  base0F: '#9bbbdc',
  base0H: '#c78626',
  base0I: '#363636',
  base0J: '#342e24',
  base0K: '#242424',
  base0L: '#242424',
};

const ChromeDefault: Theme = {
  displayName: 'Chrome (default)',
  hidden: true,
  base00: '#ffffff',
  base01: '#f3f3f3',
  base02: '#eeeeee',
  base03: '#dadada',
  base04: '#888888',
  base05: '#5a5a5a',
  base06: '#303942',
  base07: '#222222',
  base08: '#881280',
  base09: '#222222',
  base0A: '#FFFF00',
  base0B: '#1a1aa6',
  base0C: '#c80000',
  base0D: '#236e25',
  base0E: '#aa0d91',
  base0F: '#994500',
  base0H: '#3879d9',
  base0I: '#dadada',
  base0J: '#ebf1fb',
  base0K: '#ffffff',
  base0L: '#222222',
};

const Dracula: Theme = {
  displayName: 'Dracula',
  base00: '#282936',
  base01: '#3a3c4e',
  base02: '#4d4f68',
  base03: '#626483',
  base04: '#6f7191',
  base05: '#e9e9f4',
  base06: '#f1f2f8',
  base07: '#f7f7fb',
  base08: '#ff79c6',
  base09: '#bd93f9',
  base0A: '#fafa8c',
  base0B: '#f1fa8c',
  base0C: '#a1efe4',
  base0D: '#4afa7b',
  base0E: '#ff79c6',
  base0F: '#f8f8f2',
  base0H: '#181a21',
  base0I: '#323547',
  base0J: '#323547',
  base0K: '#f7f7fb',
  base0L: '#000000',
};

const Eighties: Theme = {
  displayName: 'Eighties',
  base00: '#2d2d2d',
  base01: '#393939',
  base02: '#515151',
  base03: '#747369',
  base04: '#a09f93',
  base05: '#d3d0c8',
  base06: '#EEFF00',
  base07: '#f2f0ec',
  base08: '#f2777a',
  base09: '#f99157',
  base0A: '#4afa7b',
  base0B: '#99cc99',
  base0C: '#66cccc',
  base0D: '#4afa7b',
  base0E: '#cc99cc',
  base0F: '#d27b53',
  base0H: '#f2f0ec',
  base0I: '#3f3e3e',
  base0J: '#3f3e3e',
  base0K: '#2d2d2d',
  base0L: '#121212',
};

const FirefoxDark: Theme = {
  displayName: 'Firefox (dark)',
  hidden: true,
  base00: '#393f4c',
  base01: '#393f4c',
  base02: '#454d5d',
  base03: '#454D5D',
  base04: '#8fa1b2',
  base05: '#a9bacb',
  base06: '#e9f4fe',
  base07: '#ffffff',
  base08: '#00ff7f',
  base09: '#eb5368',
  base0A: '#00ff7f',
  base0B: '#e9f4fe',
  base0C: '#bcb8db',
  base0D: '#e9f4fe',
  base0E: '#e9f4fe',
  base0F: '#e9f4fe',
  base0H: '#5675b9',
  base0I: '#475983',
  base0J: '#475983',
  base0K: '#ffffff',
  base0L: '#181d20',
};

const FirefoxLight: Theme = {
  displayName: 'Firefox (light)',
  hidden: true,
  base00: '#ffffff',
  base01: '#fcfcfc',
  base02: '#dde1e4',
  base03: '#c1c1c1',
  base04: '#888888',
  base05: '#767676',
  base06: '#585959',
  base07: '#585959',
  base08: '#2e9dd5',
  base09: '#676bff',
  base0A: '#FFFF00',
  base0B: '#5b5fff',
  base0C: '#393f4c',
  base0D: '#ed2655',
  base0E: '#4f88cc',
  base0F: '#393f4c',
  base0H: '#4c9ed9',
  base0I: '#e4f1fa',
  base0J: '#e4f1fa',
  base0K: '#f4f7fa',
  base0L: '#585959',
};

const Flat: Theme = {
  displayName: 'Flat',
  base00: '#2C3E50',
  base01: '#34495E',
  base02: '#7F8C8D',
  base03: '#95A5A6',
  base04: '#BDC3C7',
  base05: '#e0e0e0',
  base06: '#EEFF00',
  base07: '#ECF0F1',
  base08: '#E74C3C',
  base09: '#E67E22',
  base0A: '#64fa82',
  base0B: '#2ECC71',
  base0C: '#1ABC9C',
  base0D: '#3498DB',
  base0E: '#b670d2',
  base0F: '#be643c',
  base0H: '#6a8db1',
  base0I: '#364c62',
  base0J: '#364c62',
  base0K: '#2C3E50',
  base0L: '#2C3E50',
};

const Materia: Theme = {
  displayName: 'Materia',
  base00: '#263238',
  base01: '#2C393F',
  base02: '#37474F',
  base03: '#707880',
  base04: '#C9CCD3',
  base05: '#CDD3DE',
  base06: '#EEFF00',
  base07: '#FFFFFF',
  base08: '#EC5F67',
  base09: '#EA9560',
  base0A: '#00ff84',
  base0B: '#8BD649',
  base0C: '#80CBC4',
  base0D: '#89DDFF',
  base0E: '#82AAFF',
  base0F: '#EC5F67',
  base0H: '#0084ff',
  base0I: '#314048',
  base0J: '#314048',
  base0K: '#263238',
  base0L: '#263238',
};

const Phd: Theme = {
  displayName: 'Phd',
  base00: '#061229',
  base01: '#2a3448',
  base02: '#4d5666',
  base03: '#717885',
  base04: '#9a99a3',
  base05: '#b8bbc2',
  base06: '#DDDDDD',
  base07: '#ffffff',
  base08: '#d07346',
  base09: '#f0a000',
  base0A: '#00c8fa',
  base0B: '#99bf52',
  base0C: '#72b9bf',
  base0D: '#5299bf',
  base0E: '#9989cc',
  base0F: '#b08060',
  base0H: '#4b73bf',
  base0I: '#112243',
  base0J: '#112243',
  base0K: '#061229',
  base0L: '#061229',
};

module.exports = {
  ChromeDark,
  ChromeDefault,
  Dracula,
  Eighties,
  FirefoxDark,
  FirefoxLight,
  Flat,
  Materia,
  Phd,
};
