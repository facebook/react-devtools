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
        position: 'relative',
        width: '1.5rem',
        height: '1.5rem',
        background: isTransparent ? 'none' : theme.base00,
        border: 'none',
        borderRadius: '0.125rem',
        outline: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: isActive ? theme.state00 : (isHovered ? theme.state06 : theme.base05),
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      title={title}
    >
      <SvgIcon
        path={icon}
        style={{
          position: 'absolute',
          top: '50%',
          bottom: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </button>
  )
);

export default IconButton;
