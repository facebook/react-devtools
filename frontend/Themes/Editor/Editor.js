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
const ColorInput = require('./ColorInput');
const ColorGroups = require('./ColorGroups');
const {sansSerif} = require('../Fonts');
const Preview = require('../Preview');
const Themes = require('../Themes');

import type {Theme} from '../../types';

// The editor itself should use a known safe theme,
// In case a user messes up a custom theme and renders it unusable.
// The editor should remain usable in this case.
const safeTheme = Themes.ChromeDefault;

const colors = Object.assign({},
  ColorGroups.Base,
  ColorGroups.Selection,
  ColorGroups.Syntax
);

class Editor extends React.Component {
  _customTheme: Theme;

  props: {
    defaultThemeName: string,
    hide: () => {},
    saveTheme: (theme: Theme) => {},
    theme: Theme,
  };

  state: {
    updateCounter: number,
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      updateCounter: 0,
    };

    this._customTheme = Object.assign({}, props.theme);
  }

  getChildContext() {
    return {
      theme: this._customTheme,
    };
  }

  render() {
    const {hide} = this.props;
    const {updateCounter} = this.state;

    return (
      <div
        onClick={event => event.stopPropagation()}
        style={editorStyle(safeTheme)}
      >
        <h3 style={styles.header}>Custom Theme</h3>

        <div style={styles.row}>
          <div style={groupStyle(safeTheme)}>
            {Object.keys(colors).map(key => (
              <ColorInput
                descriptions={colors[key]}
                customTheme={this._customTheme}
                key={key}
                label={colors[key]}
                propertyName={key}
                udpatePreview={this._udpatePreview}
                theme={safeTheme}
              />
            ))}
          </div>

          <div style={styles.previewWrapper}>
            <Preview
              key={updateCounter}
              theme={this._customTheme}
            />
          </div>
        </div>

        <div style={styles.buttons}>
          <button onClick={hide}>Cancel</button>
          <button onClick={this._reset}>Reset</button>
          <button onClick={this._save}>Save</button>
        </div>
      </div>
    );
  }

  _udpatePreview = () => {
    this.setState(state => ({
      updateCounter: state.updateCounter + 1,
    }));
  };

  _reset = () => {
    const {defaultThemeName} = this.props;

    const defaultTheme = Themes[defaultThemeName];

    for (const key in defaultTheme) {
      this._customTheme[key] = defaultTheme[key];
    }

    this._udpatePreview();
  };

  _save = () => {
    const {hide, saveTheme} = this.props;

    saveTheme(this._customTheme);
    hide();
  };
}

Editor.childContextTypes = {
  theme: React.PropTypes.object,
};

const WrappedEditor = decorate({
  listeners() {
    return [];
  },
  props(store, props) {
    return {
      defaultThemeName: store.themeStore.defaultThemeName,
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
  margin: '0.5rem',
  borderRadius: '0.25rem',
  backgroundColor: theme.base01,
  color: theme.base05,
  border: `1px solid ${theme.base03}`,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
});

const groupStyle = (theme: Theme) => ({
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  maxHeight: '8rem',
  borderRadius: '0.25rem',
});

const styles = {
  header: {
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  buttons: {
    marginTop: '0.5rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewWrapper: {
    flex: '0 0 auto',
    marginLeft: '0.5rem',
  },
};

module.exports = WrappedEditor;
