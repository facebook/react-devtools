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

const PropTypes = require('prop-types');

const React = require('react');

const ExampleIconButton = require('./ExampleIconButton');
const Icons = require('../../../frontend/Icons');
const Input = require('../../../frontend/Input');
const Preview = require('../../../frontend/Themes/Preview');
const SettingsCheckbox = require('../../../frontend/SettingsCheckbox');

import type {Theme} from '../../../frontend/types';

type Context = {
  theme: Theme,
};

const LeftPane = (_: any, {theme}: Context) => (
  <div style={staticStyles.container}>
    <div style={menuRowStyle(theme)}>
      <div style={staticStyles.iconsColumn}>
        <ExampleIconButton
          path={Icons.INSPECT}
          theme={theme}
        />
        <ExampleIconButton
          path={Icons.SETTINGS}
          theme={theme}
        />
        <SettingsCheckbox
          isChecked={false}
          label="Example checkbox"
          onChange={noop}
        />
      </div>
      <Input
        placeholder="Example input"
        style={inputStyle(theme)}
      />
    </div>
    <Preview theme={theme} />
    <ul style={listStyle(theme)}>
      <li style={listItemStyle(false, false, theme)}>div</li>
      <li style={listItemStyle(true, true, theme)}>Grandparent</li>
      <li style={listItemStyle(false, true, theme)}>Parent</li>
      <li style={listItemStyle(false, false, theme)}>div</li>
    </ul>
  </div>
);

LeftPane.contextTypes = {
  theme: PropTypes.object,
};

const noop = () => {};

const inputStyle = (theme: Theme) => ({
  padding: '0.25rem',
  border: `1px solid ${theme.base02}`,
  outline: 'none',
  borderRadius: '0.25rem',
});

const listItemStyle = (isSelected: boolean, isComposite: boolean, theme: Theme) => {
  let color;
  if (isSelected) {
    color = theme.state02;
  } else if (isComposite) {
    color = theme.special05;
  }

  return {
    backgroundColor: isSelected ? theme.state00 : 'transparent',
    color,
    cursor: isSelected ? 'default' : 'pointer',
    padding: '0.25rem 0.5rem',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    userSelect: 'none',
    display: 'inline-block',
    marginRight: '2px',
  };
};

const listStyle = (theme: Theme) => ({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  maxHeight: '80px',
  overflow: 'auto',
  backgroundColor: theme.base01,
  borderTop: `1px solid ${theme.base03}`,
});

const menuRowStyle = (theme: Theme) => ({
  display: 'flex',
  direction: 'row',
  padding: '0.25rem',
  borderBottom: `1px solid ${theme.base03}`,
  backgroundColor: theme.base01,
});


const staticStyles = {
  container: {
    width: '100%',
  },
  iconsColumn: {
    display: 'flex',
    direction: 'row',
    alignItems: 'center',
    flexGrow: '1',
  },
};

module.exports = LeftPane;
