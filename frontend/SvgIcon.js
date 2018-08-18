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

type Props = {
  path: string,
  style?: Object,
};

const SvgIcon = ({ path, style }: Props) => (
  <svg
    style={{
      ...DEFAULT_STYLE,
      ...style,
    }}
    viewBox="0 0 24 24"
  >
    <path d={path}></path>
  </svg>
);

const DEFAULT_STYLE = {
  flex: '0 0 1rem',
  width: '1rem',
  height: '1rem',
  fill: 'currentColor',
};

module.exports = SvgIcon;
