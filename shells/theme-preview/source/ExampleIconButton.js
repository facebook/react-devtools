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

const Hoverable = require('../../../frontend/Hoverable');
const SvgIcon = require('../../../frontend/SvgIcon');

import type {Theme} from '../../../frontend/types';

const ExampleIconButton = Hoverable(
  ({ isHovered, onMouseEnter, onMouseLeave, path, theme }) => (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={iconButtonStyle(isHovered, theme)}
      title="Example Icon Button"
    >
      <SvgIcon path={path} />
    </button>
  )
);

const iconButtonStyle = (isHovered: boolean, theme: Theme) => ({
  display: 'flex',
  background: 'none',
  border: 'none',
  color: isHovered ? theme.state06 : 'inherit',
});

module.exports = ExampleIconButton;
