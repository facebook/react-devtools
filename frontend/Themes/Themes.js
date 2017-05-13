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
 * These are not directly exposed to the user.
 * Rather if the user chooses the "default" theme, these will be used to match the browser UI.
 * 
 * Before adding a new theme, refer to the Theme docs in frontend/types.
 * Each theme key has a purpose and guidelines should be followed to ensure legibility.
 */

const TODO: Theme = {
  name: 'TODO',
  base00: '#181818',
  base01: '#282828',
  base02: '#383838',
  base03: '#585858',
  base04: '#b8b8b8',
  base05: '#d8d8d8',
  base06: '#e8e8e8',
  base07: '#f8f8f8',
  base08: '#ab4642',
  base09: '#dc9656',
  base0A: '#EEFF00',
  base0B: '#a1b56c',
  base0C: '#86c1b9',
  base0D: '#7cafc2',
  base0E: '#ba8baf',
  base0F: '#a16946',
  base0H: '#0084ff',
};

const Apathy: Theme = {
  name: 'Apathy',
  base00: '#031A16',
  base01: '#0B342D',
  base02: '#184E45',
  base03: '#2B685E',
  base04: '#5F9C92',
  base05: '#81B5AC',
  base06: '#A7CEC8',
  base07: '#D2E7E4',
  base08: '#3E9688',
  base09: '#3E7996',
  base0A: '#A7CEC8',
  base0B: '#883E96',
  base0C: '#963E4C',
  base0D: '#96883E',
  base0E: '#4C963E',
  base0F: '#3E965B',
  base0H: '#D2E7E4',
};

const AtelierForest: Theme = {
  name: 'AtelierForest',
  base00: '#1b1918',
  base01: '#2c2421',
  base02: '#68615e',
  base03: '#766e6b',
  base04: '#9c9491',
  base05: '#a8a19f',
  base06: '#EEFF00',
  base07: '#f1efee',
  base08: '#f22c40',
  base09: '#df5320',
  base0A: '#EEFF00',
  base0B: '#7b9726',
  base0C: '#3d97b8',
  base0D: '#407ee7',
  base0E: '#6666ea',
  base0F: '#c33ff3',
  base0H: '#f1efee',
};

const Bespin: Theme = {
  name: 'Bespin',
  base00: '#28211c',
  base01: '#36312e',
  base02: '#5e5d5c',
  base03: '#666666',
  base04: '#797977',
  base05: '#8a8986',
  base06: '#EEFF00',
  base07: '#baae9e',
  base08: '#cf6a4c',
  base09: '#cf7d34',
  base0A: '#EEFF00',
  base0B: '#54be0d',
  base0C: '#afc4db',
  base0D: '#5ea6ea',
  base0E: '#9b859d',
  base0F: '#937121',
  base0H: '#baae9e',
};

const Chalk: Theme = {
  name: 'Chalk',
  base00: '#151515',
  base01: '#202020',
  base02: '#303030',
  base03: '#505050',
  base04: '#b0b0b0',
  base05: '#d0d0d0',
  base06: '#EEFF00',
  base07: '#f5f5f5',
  base08: '#fb9fb1',
  base09: '#eda987',
  base0A: '#EEFF00',
  base0B: '#acc267',
  base0C: '#12cfc0',
  base0D: '#6fc2ef',
  base0E: '#e1a3ee',
  base0F: '#deaf8f',
  base0H: '#f5f5f5',
};

const ChromeDark: Theme = {
  name: 'Chrome (dark)',
  base00: '#242424',
  base01: '#363636',
  base02: '#454545',
  base03: '#666666',
  base04: '#aaaaaa',
  base05: '#dddddd',
  base06: '#eeeeee',
  base07: '#ffffff',
  base08: '#5dafd6',
  base09: '#a1f7b5',
  base0A: '#FFFF33',
  base0B: '#f29766',
  base0C: '#d2c057',
  base0D: '#34d1c5',
  base0E: '#9a7fd5',
  base0F: '#9bbbdc',
  base0H: '#c78626',
};

// Chrome defaults obtained by inspecting Chrome devtools with another devtools instance
const ChromeDefault: Theme = {
  name: 'Chrome (default)',
  base00: '#ffffff',
  base01: '#f3f3f3',
  base02: '#eeeeee',
  base03: '#dadada',
  base04: '#cccccc',
  base05: '#5a5a5a',
  base06: '#303942',
  base07: '#222222',
  base08: '#881280',
  base09: '#222222',
  base0A: '#EEFF00',
  base0B: '#1155cc',
  base0C: '#c80000',
  base0D: '#236e25',
  base0E: '#aa0d91',
  base0F: '#994500',
  base0H: '#0084ff',
};

const Darktooth: Theme = {
  name: 'Darktooth',
  base00: '#1D2021',
  base01: '#32302F',
  base02: '#504945',
  base03: '#665C54',
  base04: '#928374',
  base05: '#A89984',
  base06: '#D5C4A1',
  base07: '#FDF4C1',
  base08: '#FB543F',
  base09: '#FE8625',
  base0A: '#D5C4A1',
  base0B: '#95C085',
  base0C: '#8BA59B',
  base0D: '#0D6678',
  base0E: '#8F4673',
  base0F: '#A87322',
  base0H: '#FDF4C1',
};

const Dracula: Theme = {
  name: 'Dracula',
  base00: '#282a36',
  base01: '#3a3c4e',
  base02: '#6d6f88',
  base03: '#8284a3',
  base04: '#282a36',
  base05: '#e9e9f4',
  base06: '#FFFF88',
  base07: '#00f769',
  base08: '#ff79c6',
  base09: '#bd93f9',
  base0A: '#FFFF88',
  base0B: '#e5ee86',
  base0C: '#a1efe4',
  base0D: '#62d6e8',
  base0E: '#b45bcf',
  base0F: '#00f769',
  base0H: '#00f769',
};

const Eighties: Theme = {
  name: 'Eighties',
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
  base0A: '#EEFF00',
  base0B: '#99cc99',
  base0C: '#66cccc',
  base0D: '#6699cc',
  base0E: '#cc99cc',
  base0F: '#d27b53',
  base0H: '#f2f0ec',
};

const FirefoxDark: Theme = {
  name: 'Firefox (dark)',
  base00: '#393f4c',
  base01: '#475983',
  base02: '#bbbbbb',
  base03: '#8fa1b2',
  base04: '#ffffff',
  base05: '#ffffff',
  base06: '#000000',
  base07: '#5675b9',
  base08: '#00ff7f',
  base09: '#eb5368',
  base0A: '#000000',
  base0B: '#e9f4fe',
  base0C: '#bcb8db',
  base0D: '#e9f4fe',
  base0E: '#e9f4fe',
  base0F: '#e9f4fe',
  base0H: '#5675b9',
};

const Flat: Theme = {
  name: 'Flat',
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
  base0A: '#EEFF00',
  base0B: '#2ECC71',
  base0C: '#1ABC9C',
  base0D: '#3498DB',
  base0E: '#9B59B6',
  base0F: '#be643c',
  base0H: '#ECF0F1',
};

const GitHub: Theme = {
  name: 'GitHub',
  base00: '#ffffff',
  base01: '#f5f5f5',
  base02: '#c8c8fa',
  base03: '#969896',
  base04: '#e8e8e8',
  base05: '#333333',
  base06: '#EEFF00',
  base07: '#0084ff',
  base08: '#ed6a43',
  base09: '#0086b3',
  base0A: '#EEFF00',
  base0B: '#183691',
  base0C: '#183691',
  base0D: '#795da3',
  base0E: '#a71d5d',
  base0F: '#333333',
  base0H: '#0084ff',
};

const GoogleLight: Theme = {
  name: 'GoogleLight',
  base00: '#ffffff',
  base01: '#e0e0e0',
  base02: '#c5c8c6',
  base03: '#b4b7b4',
  base04: '#969896',
  base05: '#373b41',
  base06: '#EEFF00',
  base07: '#1d1f21',
  base08: '#CC342B',
  base09: '#F96A38',
  base0A: '#EEFF00',
  base0B: '#198844',
  base0C: '#3971ED',
  base0D: '#3971ED',
  base0E: '#A36AC7',
  base0F: '#3971ED',
  base0H: '#1d1f21',
};

const Materia: Theme = {
  name: 'Materia',
  base00: '#263238',
  base01: '#2C393F',
  base02: '#37474F',
  base03: '#707880',
  base04: '#C9CCD3',
  base05: '#CDD3DE',
  base06: '#EEFF00',
  base07: '#0084ff',
  base08: '#EC5F67',
  base09: '#EA9560',
  base0A: '#EEFF00',
  base0B: '#8BD649',
  base0C: '#80CBC4',
  base0D: '#89DDFF',
  base0E: '#82AAFF',
  base0F: '#EC5F67',
  base0H: '#0084ff',
};

const MexicoLight: Theme = {
  name: 'MexicoLight',
  base00: '#f8f8f8',
  base01: '#e8e8e8',
  base02: '#d8d8d8',
  base03: '#b8b8b8',
  base04: '#585858',
  base05: '#383838',
  base06: '#EEFF00',
  base07: '#22A6ff',
  base08: '#ab4642',
  base09: '#dc9656',
  base0A: '#EEFF00',
  base0B: '#538947',
  base0C: '#4b8093',
  base0D: '#7cafc2',
  base0E: '#96609e',
  base0F: '#a16946',
  base0H: '#22A6ff',
};

const Mocha: Theme = {
  name: 'Mocha',
  base00: '#3B3228',
  base01: '#534636',
  base02: '#645240',
  base03: '#7e705a',
  base04: '#b8afad',
  base05: '#d0c8c6',
  base06: '#EEFF00',
  base07: '#f5eeeb',
  base08: '#cb6077',
  base09: '#d28b71',
  base0A: '#EEFF00',
  base0B: '#beb55b',
  base0C: '#7bbda4',
  base0D: '#8ab3b5',
  base0E: '#a89bb9',
  base0F: '#bb9584',
  base0H: '#f5eeeb',
};

const Phd: Theme = {
  name: 'Phd',
  base00: '#061229',
  base01: '#2a3448',
  base02: '#4d5666',
  base03: '#717885',
  base04: '#9a99a3',
  base05: '#b8bbc2',
  base06: '#EEFF00',
  base07: '#ffffff',
  base08: '#d07346',
  base09: '#f0a000',
  base0A: '#EEFF00',
  base0B: '#99bf52',
  base0C: '#72b9bf',
  base0D: '#5299bf',
  base0E: '#9989cc',
  base0F: '#b08060',
  base0H: '#ffffff',
};

module.exports = {
  Apathy,
  AtelierForest,
  Bespin,
  Chalk,
  Darktooth,
  ChromeDefault,
  ChromeDark,
  Dracula,
  Eighties,
  FirefoxDark,
  Flat,
  GitHub,
  GoogleLight,
  Materia,
  MexicoLight,
  Mocha,
  Phd,
  TODO,
};
