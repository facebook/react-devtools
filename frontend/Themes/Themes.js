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

const ApathyDark: Theme = {
  displayName: 'Apathy (dark)',
  base00: '#1b322e',
  base01: '#30695f',
  base02: '#184E45',
  base03: '#2B685E',
  base04: '#5F9C92',
  base05: '#f5fcfb',
  base06: '#A7CEC8',
  base07: '#D2E7E4',
  base08: '#3E9688',
  base09: '#3E7996',
  base0A: '#3E4C96',
  base0B: '#883E96',
  base0C: '#963E4C',
  base0D: '#96883E',
  base0E: '#4C963E',
  base0F: '#3E965B',
  base0H: '#28423d',
  base0I: '#28423d',
  base0J: '#28423d',
  base0K: '#f5fcfb',
  base0L: '#f5fcfb',
};

const ApathyLight: Theme = {
  displayName: 'Apathy (light)',
  base00: '#D2E7E4',
  base01: '#fff',
  base02: '#184E45',
  base03: '#2B685E',
  base04: '#5F9C92',
  base05: 'rgba(0, 0, 0, .7)',
  base06: '#A7CEC8',
  base07: '#D2E7E4',
  base08: '#3E9688',
  base09: '#3E7996',
  base0A: '#3E4C96',
  base0B: '#883E96',
  base0C: '#963E4C',
  base0D: '#96883E',
  base0E: '#4C963E',
  base0F: '#3E965B',
  base0H: '#f5fcfb',
  base0I: '#f5fcfb',
  base0J: '#f5fcfb',
  base0K: '#2b2d2d',
  base0L: '#f5fcfb',
};

const ChromeDark: Theme = {
  displayName: 'Chrome (dark)',
  hidden: true,
  base00: '#242424',
  base01: '#2a2a2a',
  base02: '#363636',
  base03: '#404040',
  base04: '#777777',
  base05: '#a5a5a5',
  special00: '#5db0d7',
  special01: '#a1f7b5',
  special02: '#f29766',
  special03: '#d2c057',
  special04: '#34d1c5',
  special05: '#9a7fd5',
  special06: '#9bbbdc',
  special07: '#777777',
  state00: '#c78626',
  state01: '#363636',
  state02: '#242424',
  state03: '#342e24',
  state04: '#66ff88',
  state05: '#242424',
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
  special00: '#881280',
  special01: '#222222',
  special02: '#1a1aa6',
  special03: '#c80000',
  special04: '#236e25',
  special05: '#aa0d91',
  special06: '#994500',
  special07: '#888888',
  state00: '#3879d9',
  state01: '#dadada',
  state02: '#ffffff',
  state03: '#ebf1fb',
  state04: '#FFFF00',
  state05: '#222222',
};

const Dracula: Theme = {
  displayName: 'Dracula',
  base00: '#282936',
  base01: '#3a3c4e',
  base02: '#4d4f68',
  base03: '#626483',
  base04: '#6f7191',
  base05: '#e9e9f4',
  special00: '#ff79c6',
  special01: '#bd93f9',
  special02: '#f1fa8c',
  special03: '#a1efe4',
  special04: '#4afa7b',
  special05: '#ff79c6',
  special06: '#f8f8f2',
  special07: '#6f7191',
  state00: '#181a21',
  state01: '#323547',
  state02: '#f7f7fb',
  state03: '#323547',
  state04: '#fafa8c',
  state05: '#000000',
};

const Eighties: Theme = {
  displayName: 'Eighties',
  base00: '#2d2d2d',
  base01: '#393939',
  base02: '#515151',
  base03: '#747369',
  base04: '#a09f93',
  base05: '#d3d0c8',
  special00: '#f2777a',
  special01: '#f99157',
  special02: '#99cc99',
  special03: '#66cccc',
  special04: '#4afa7b',
  special05: '#cc99cc',
  special06: '#d27b53',
  special07: '#a09f93',
  state00: '#f2f0ec',
  state01: '#3f3e3e',
  state02: '#2d2d2d',
  state03: '#3f3e3e',
  state04: '#4afa7b',
  state05: '#121212',
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
  special00: '#00ff7f',
  special01: '#eb5368',
  special02: '#e9f4fe',
  special03: '#bcb8db',
  special04: '#e9f4fe',
  special05: '#e9f4fe',
  special06: '#e9f4fe',
  special07: '#8fa1b2',
  state00: '#5675b9',
  state01: '#475983',
  state02: '#ffffff',
  state03: '#475983',
  state04: '#00ff7f',
  state05: '#181d20',
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
  special00: '#2e9dd5',
  special01: '#676bff',
  special02: '#5b5fff',
  special03: '#393f4c',
  special04: '#ed2655',
  special05: '#4f88cc',
  special06: '#393f4c',
  special07: '#888888',
  state00: '#4c9ed9',
  state01: '#e4f1fa',
  state02: '#f4f7fa',
  state03: '#e4f1fa',
  state04: '#FFFF00',
  state05: '#585959',
};

const Flat: Theme = {
  displayName: 'Flat',
  base00: '#2C3E50',
  base01: '#34495E',
  base02: '#7F8C8D',
  base03: '#95A5A6',
  base04: '#BDC3C7',
  base05: '#e0e0e0',
  special00: '#E74C3C',
  special01: '#E67E22',
  special02: '#2ECC71',
  special03: '#1ABC9C',
  special04: '#3498DB',
  special05: '#b670d2',
  special06: '#be643c',
  special07: '#BDC3C7',
  state00: '#6a8db1',
  state01: '#364c62',
  state02: '#2C3E50',
  state03: '#364c62',
  state04: '#64fa82',
  state05: '#2C3E50',
};

const GruvboxDark: Theme = {
  displayName: 'Gruvbox (dark)',
  base00: '#282828',
  base01: '#3c3836',
  base02: '#504945',
  base03: '#928374',
  base04: '#bdae93',
  base05: '#ebdbb2',
  special00: '#83a598',
  special01: '#d3869b',
  special02: '#b8bb26',
  special03: '#689d6a',
  special04: '#fabd2f',
  special05: '#fe8019',
  special06: '#fe8019',
  special07: '#bdae93',
  state00: '#504945',
  state01: '#3c3836',
  state02: '#fbf1c7',
  state03: '#3c3836',
  state04: '#7c6f64',
  state05: '#fbf1c7',
};

const GruvboxLight: Theme = {
  displayName: 'Gruvbox (light)',
  base00: '#fbf1c7',
  base01: '#ebdbb2',
  base02: '#d5c4a1',
  base03: '#928374',
  base04: '#282828',
  base05: '#3c3836',
  special00: '#076678',
  special01: '#8f3f71',
  special02: '#98971a',
  special03: '#af3a03',
  special04: '#458588',
  special05: '#fe8019',
  special06: '#b57614',
  special07: '#282828',
  state00: '#bdae93',
  state01: '#d5c4a1',
  state02: '#282828',
  state03: '#d5c4a1',
  state04: '#d5c4a1',
  state05: '#282828',
};

const Materia: Theme = {
  displayName: 'Materia',
  base00: '#263238',
  base01: '#2C393F',
  base02: '#37474F',
  base03: '#707880',
  base04: '#C9CCD3',
  base05: '#CDD3DE',
  special00: '#EC5F67',
  special01: '#EA9560',
  special02: '#8BD649',
  special03: '#80CBC4',
  special04: '#89DDFF',
  special05: '#82AAFF',
  special06: '#EC5F67',
  special07: '#C9CCD3',
  state00: '#0084ff',
  state01: '#314048',
  state02: '#263238',
  state03: '#314048',
  state04: '#00ff84',
  state05: '#263238',
};

const MaterialDark: Theme = {
  displayName: 'Material Dark',
  base00: '#263239',
  base01: '#373b41',
  base02: '#3e4a51',
  base03: '#445052',
  base04: '#718184',
  base05: '#B2CCD6',
  special00: '#f95479',
  special01: '#F78C6A',
  special02: '#C3E88D',
  special03: '#89DDF3',
  special04: '#82AAFF',
  special05: '#C792EA',
  special06: '#FFCB6B',
  special07: '#718184',
  state00: '#4a55b9',
  state01: '#3e4a50',
  state02: '#ffffff',
  state03: '#212b30',
  state04: '#4a55b9',
  state05: '#ffffff',
};

const OceanDark: Theme = {
  displayName: 'Ocean Dark',
  base00: '#232730',
  base01: '#2b303c',
  base02: '#323943',
  base03: '#414551',
  base04: '#65727e',
  base05: '#757984',
  special00: '#b48bae',
  special01: '#c0c5ce',
  special02: '#a3c08a',
  special03: '#ab7866',
  special04: '#eccd88',
  special05: '#d06a77',
  special06: '#757a85',
  special07: '#65727e',
  state00: '#a0a4ae',
  state01: '#314048',
  state02: '#263238',
  state03: '#314048',
  state04: '#d06a77',
  state05: '#1c1f27',
};

const Phd: Theme = {
  displayName: 'Phd',
  base00: '#061229',
  base01: '#2a3448',
  base02: '#4d5666',
  base03: '#717885',
  base04: '#9a99a3',
  base05: '#b8bbc2',
  special00: '#d07346',
  special01: '#f0a000',
  special02: '#99bf52',
  special03: '#72b9bf',
  special04: '#5299bf',
  special05: '#9989cc',
  special06: '#b08060',
  special07: '#9a99a3',
  state00: '#4b73bf',
  state01: '#112243',
  state02: '#061229',
  state03: '#112243',
  state04: '#00c8fa',
  state05: '#061229',
};

const Tomorrow: Theme = {
  displayName: 'Tomorrow',
  base00: '#ffffff',
  base01: '#e0e0e0',
  base02: '#d6d6d6',
  base03: '#8e908c',
  base04: '#969896',
  base05: '#4d4d4c',
  special00: '#c82829',
  special01: '#f5871f',
  special02: '#718c00',
  special03: '#3e999f',
  special04: '#4271ae',
  special05: '#8959a8',
  special06: '#a3685a',
  special07: '#969896',
  state00: '#4271ae',
  state01: '#e0e0e0',
  state02: '#ffffff',
  state03: '#e0e0e0',
  state04: '#eab700',
  state05: '#1d1f21',
};

const TomorrowNight: Theme = {
  displayName: 'Tomorrow Night',
  base00: '#1d1f21',
  base01: '#282a2e',
  base02: '#373b41',
  base03: '#969896',
  base04: '#b4b7b4',
  base05: '#c5c8c6',
  special00: '#cc6666',
  special01: '#de935f',
  special02: '#b5bd68',
  special03: '#8abeb7',
  special04: '#81a2be',
  special05: '#b294bb',
  special06: '#a3685a',
  special07: '#b4b7b4',
  state00: '#0084ff',
  state01: '#e0e0e0',
  state02: '#282a2e',
  state03: '#373b41',
  state04: '#f0c674',
  state05: '#1d1f21',
};

module.exports = {
  ApathyDark,
  ApathyLight,
  ChromeDark,
  ChromeDefault,
  Dracula,
  Eighties,
  FirefoxDark,
  FirefoxLight,
  Flat,
  GruvboxDark,
  GruvboxLight,
  Materia,
  MaterialDark,
  OceanDark,
  Phd,
  Tomorrow,
  TomorrowNight,
};
