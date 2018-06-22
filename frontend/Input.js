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

import type {Theme} from './types';

const PropTypes = require('prop-types');
const React = require('react');

type Context = {
  theme: Theme,
};

type Props = {
  theme?: Theme,
  style?: Object,
  innerRef? : Function,
};

/**
 * Same as base <input> component but with pre-applied theme styles.
 * Props theme overrides context theme if provided.
 */
const Input = (props: Props, context: Context) => {
  const {
    style = {},
    theme,
    innerRef,
    // A dangling comma here is now invalid js. TODO: update eslint
    // eslint-disable-next-line comma-dangle
    ...rest
  } = props;

  const chosenTheme = theme ? theme : context.theme;

  return (
    <input
      style={{
        ...inputStyle(chosenTheme),
        ...style,
      }}
      ref={innerRef}
      {...rest}
    />
  );
};

Input.contextTypes = {
  theme: PropTypes.object.isRequired,
};

const inputStyle = (theme: Theme) => ({
  backgroundColor: theme.base00,
  color: theme.base05,
});

module.exports = Input;
