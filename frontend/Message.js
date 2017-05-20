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

var React = require('react');
var { sansSerif } = require('./Themes/Fonts');

import type { Theme } from './types';

type Props = {
  children?: any,
};
type Context = {
  theme: Theme,
};

function Message(props: Props, context: Context) {
  const { theme } = context;
  return (
    <div style={messageStyle(theme)}>
      {props.children}
    </div>
  );
}

Message.contextTypes = {
  theme: React.PropTypes.object.isRequired,
};

const messageStyle = (theme: Theme) => ({
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  textAlign: 'center',
  padding: 30,
  flex: 1,

  // This color is hard-coded to match app.html and standalone.js
  // Without it, the loading headers change colors and look weird
  color: '#aaa',
});

module.exports = Message;
