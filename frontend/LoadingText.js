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

const React = require('react');

const {sansSerif} = require('./Themes/Fonts');
const Themes = require('./Themes/Themes');
const ThemeStore = require('./Themes/Store');
const {getSafeThemeName} = require('./Themes/utils');

import type {Theme} from './types';

const savedThemeName = getSafeThemeName(ThemeStore.get());
const savedTheme = Themes[savedThemeName];

type Props = {
  children: string,
};

function LoadingText({ children }: Props) {
  return (
    <div style={loadingStyle(savedTheme)}>
      <h2>{children}</h2>
    </div>
  );
}

const loadingStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  backgroundColor: theme.base00,
  color: theme.base04,
  textAlign: 'center',
  padding: 30,
  flex: 1,
});

module.exports = LoadingText;
