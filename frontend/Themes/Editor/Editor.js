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
const {monospace, sansSerif} = require('../Fonts');
const Preview = require('../Preview');
const SvgIcon = require('../../SvgIcon');
const Themes = require('../Themes');
const {deserialize, serialize} = require('../Serializer');
const {CUSTOM_THEME_NAME} = require('../constants');

import type {DOMEvent, Theme} from '../../types';

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
    changeTheme: (themeName: string) => void,
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

    this._reset();
    this._sanitizeCustomTheme();
  }

  getChildContext() {
    return {
      theme: this._customTheme,
    };
  }

  render() {
    const {hide, theme} = this.props;
    const {updateCounter} = this.state;

    return (
      <div
        onClick={event => event.stopPropagation()}
        style={editorStyle(safeTheme)}
      >
        <h3 style={styles.header}>Custom Theme</h3>

        <div style={styles.middleRow}>
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

        <div style={styles.bottomRow}>
          <div style={styles.buttons}>
            <button onClick={hide}>
              Cancel
            </button> <button onClick={this._reset}>
              Reset
            </button> <button onClick={this._save}>
              Save
            </button>
          </div>

          <div style={styles.importExportRow}>
            <SvgIcon path="
              M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,
              11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,
              3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,
              9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,
              18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,
              20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z
            "/>

            <label style={styles.shareLabel}>Import/export:</label>
            <input
              onChange={this._onShareChange}
              style={shareInput(theme)}
              type="text"
              value={serialize(this._customTheme)}
            />
          </div>
        </div>
      </div>
    );
  }

  _onShareChange = (event: DOMEvent) => {
    this._customTheme = deserialize(event.target.value, this.props.theme);
    this._sanitizeCustomTheme();
    this._udpatePreview();
  };

  _udpatePreview = () => {
    this.setState(state => ({
      updateCounter: state.updateCounter + 1,
    }));
  };

  _reset = () => {
    this._customTheme = Object.assign({}, this.props.theme);
    this._udpatePreview();
  };

  _sanitizeCustomTheme() {
    this._customTheme.displayName = CUSTOM_THEME_NAME;

    delete this._customTheme.hidden;
  }

  _save = () => {
    const {changeTheme, hide, saveTheme} = this.props;

    saveTheme(this._customTheme);
    changeTheme(CUSTOM_THEME_NAME);
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
      changeTheme: themeName => store.changeTheme(themeName),
      defaultThemeName: store.themeStore.defaultThemeName,
      saveTheme: (theme: Theme) => store.saveCustomTheme(theme),
    };
  },
}, Editor);

const editorStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'calc(100vw - 2rem)',
  maxHeight: 'calc(100vh - 2rem)',
  boxSizing: 'border-box',
  zIndex: 1,
  padding: '0.5rem',
  borderRadius: '0.25rem',
  backgroundColor: theme.base01,
  color: theme.base05,
  border: `1px solid ${theme.base03}`,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
});

const groupStyle = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  overflowY: 'auto',
  borderRadius: '0.25rem',
});

const shareInput = (theme: Theme) => ({
  flex: '0 1 15rem',
  padding: '0.25rem',
  border: `1px solid ${theme.base03}`,
  borderRadius: '0.25rem',
  fontFamily: monospace.family,
  fontSize: monospace.sizes.normal,
  color: 'inherit',
});

const styles = {
  header: {
    flex: '0 0 auto',
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  bottomRow: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '0.5rem',
  },
  buttons: {
    flex: '1 0 auto',
    marginTop: '0.5rem',
  },
  middleRow: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 1 auto',
    overflowY: 'auto',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  previewWrapper: {
    display: 'flex',
    flex: '1 0 auto',
    marginLeft: '0.5rem',
    alignItems: 'flex-start',
  },
  importExportRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: '0 0 auto',
    marginTop: '0.5rem',
  },
  shareLabel: {
    flex: '0 0 auto',
    margin: '0 0.25rem',
  },
};

module.exports = WrappedEditor;
