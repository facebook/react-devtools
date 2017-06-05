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

const Base = {
  base00: 'Default Background',
  base01: 'Soft Background',
  base02: 'Soft Middle',
  base03: 'Strong Middle',
  base04: 'Soft Foreground',
  base05: 'Default Foreground',
};

const Syntax = {
  special00: 'Custom Components',
  special01: 'Integers, Booleans',
  special02: 'Strings, Arrays',
  special03: 'Details Pane Text',
  special04: 'Functions, Objects',
  special05: 'Special Text',
  special06: 'XML Attributes',
  special07: 'Host Components',
};

const Selection = {
  state00: 'Focused Background',
  state01: 'Blurred Background',
  state03: 'Hovered Background',
  state02: 'Focused Foreground',
  state04: 'Search Background',
  state05: 'Search Foreground',
  state06: 'Interactive Hover',
};

module.exports = {
  Base,
  Selection,
  Syntax,
};
