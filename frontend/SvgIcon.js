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
  className?: string,
  path: string,
  style?: Object,
};

// TODO Remove DEFAULT_STYLE in favor of className once all styles have been migrated.
// For now, suppress inline styles when a className is provided–
// since these would always override className values.
const SvgIcon = ({ className, path, style }: Props) => (
  <svg
    className={className}
    style={className ? null : {
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
