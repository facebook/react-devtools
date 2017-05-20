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

type Props = {
  children: string,
};

function Message({ children }: Props) {
  return (
    <div style={loadingStyle}>
      <h2>{children}</h2>
    </div>
  );
}

const loadingStyle = {
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.large,
  textAlign: 'center',
  padding: 30,
  flex: 1,

  // This color is hard-coded to match packages/react-devtools/app.html and standalone.js
  // Without it, the loading headers change colors and look weird
  color: '#aaa',
};

module.exports = Message;
