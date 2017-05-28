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

const decorate = require('../../decorate');
const React = require('react');
const ColorInputGroups = require('./ColorInputGroups');
const ColorGroups = require('./ColorGroups');
const {sansSerif} = require('../Fonts');
const Themes = require('../Themes');

import type {Theme} from '../../types';

// The editor itself should use a known safe theme,
// In case a user messes up a custom theme and renders it unusable.
// The editor should remain usable in this case.
const safeTheme = Themes.ChromeDefault;

class Editor extends React.Component {
  _customTheme: Theme;

  props: {
    hide: () => {},
    saveTheme: (theme: Theme) => {},
    theme: Theme,
  };

  constructor(props, context) {
    super(props, context);

    this._customTheme = Object.assign({}, props.theme);
  }

  render() {
    const {hide} = this.props;

    return (
      <div
        onClick={event => event.stopPropagation()}
        style={editorStyle(safeTheme)}
      >
        <h3 style={styles.header}>Custom Theme</h3>

        {Object.keys(ColorGroups).map(label => (
          <ColorInputGroups
            customTheme={this._customTheme}
            descriptions={ColorGroups[label]}
            key={label}
            label={label}
            theme={safeTheme}
          />
        ))}

        <div style={styles.buttons}>
          <button onClick={hide}>Cancel</button>
          <button onClick={this._save}>Save</button>
        </div>
      </div>
    );
  }

  _save = () => {
    const {hide, saveTheme} = this.props;

    saveTheme(this._customTheme);
    hide();
  };
}

const WrappedEditor = decorate({
  listeners() {
    return [];
  },
  props(store, props) {
    return {
      saveTheme: (theme: Theme) => store.saveCustomTheme(theme),
    };
  },
}, Editor);

const editorStyle = (theme: Theme) => ({
  maxWidth: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  zIndex: 1,
  padding: '0.5rem',
  borderRadius: '0.25rem',
  backgroundColor: theme.base01,
  border: `1px solid ${theme.base03}`,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
});

const styles = {
  header: {
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  buttons: {
    marginTop: '0.25rem',
  },
};

module.exports = WrappedEditor;
