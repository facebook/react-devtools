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

const {sansSerif} = require('../Themes/Fonts');

import type {Theme} from '../types';

type Props = {
  children: string,
  theme?: Theme,
};

// This color is hard-coded to match packages/react-devtools/app.html and standalone.js
// Without it, the loading headers change colors and look weird.
const DEFAULT_COLOR = '#aaa';

/**
 * Message theme is optional.
 * It should only be specified for messages shown within the (themed) devtools wrapper.
 * Messages shown while loading will use default colors that match the parent browser/shell.
 */
function Message({ children, theme }: Props) {
  return (
    <div style={loadingStyle(theme)}>
      <h2>{children}</h2>
    </div>
  );
}

const loadingStyle = (theme: ?Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  textAlign: 'center',
  padding: 30,
  flex: 1,
  color: theme ? theme.base05 : DEFAULT_COLOR,
});

module.exports = Message;
