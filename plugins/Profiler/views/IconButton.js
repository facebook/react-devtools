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

import React from 'react';
import Hoverable from '../../../frontend/Hoverable';
import SvgIcon from '../../../frontend/SvgIcon';

const IconButton = Hoverable(
  ({ disabled, icon, isActive = false, isHovered, isTransparent = false, onClick, onMouseEnter, onMouseLeave, style, theme, title }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        background: isTransparent ? 'none' : theme.base00,
        border: 'none',
        outline: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: isActive ? theme.state00 : (isHovered ? theme.state06 : theme.base05),
        opacity: disabled ? 0.5 : 1,
        padding: '4px',
        ...style,
      }}
      title={title}
    >
      <SvgIcon path={icon} />
    </button>
  )
);

export default IconButton;
